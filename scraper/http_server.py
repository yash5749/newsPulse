#!/usr/bin/env python3
"""
News Pulse Ingestion HTTP Service
Provides a REST endpoint to trigger the ingestion pipeline.
"""
import logging
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import json
import threading

from app.config import settings
from app.database.connection import init_connection_pool, close_connection_pool
from app.jobs.ingest import IngestionPipeline

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class IngestionHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/health':
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ok"}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/ingest':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(body) if body else {}
                job_id = data.get('jobId', 'unknown')
            except json.JSONDecodeError:
                job_id = 'unknown'

            logger.info(f"Received ingestion trigger for job {job_id}")

            def run_pipeline():
                try:
                    init_connection_pool()
                    pipeline = IngestionPipeline()
                    pipeline.run_ingestion(job_id)
                    logger.info(f"Ingestion completed for job {job_id}")
                except Exception as e:
                    logger.exception(f"Ingestion failed for job {job_id}")
                finally:
                    close_connection_pool()

            thread = threading.Thread(target=run_pipeline)
            thread.daemon = True
            thread.start()

            self._set_headers(202)
            self.wfile.write(json.dumps({
                "status": "accepted",
                "jobId": job_id,
                "message": "Ingestion started"
            }).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def log_message(self, format, *args):
        logger.info("%s - %s", self.address_string(), format % args)


def run_server(port: int = None):
    if port is None:
        port = int(os.environ.get("PORT", "8000"))
    logger.info(f"Starting ingestion HTTP server on port {port}")
    server = HTTPServer(('0.0.0.0', port), IngestionHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down server")
        server.shutdown()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else None
    run_server(port)