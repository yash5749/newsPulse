#!/usr/bin/env python3
"""
News Pulse Ingestion Service
Main entry point for the Python ingestion pipeline.
"""
import logging
import sys

from app.config import settings
from app.database.connection import init_connection_pool, close_connection_pool

logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def main() -> int:
    logger.info("Starting News Pulse ingestion service")
    logger.info(f"Database: {settings.database_url}")
    logger.info(f"Cluster threshold: {settings.cluster_similarity_threshold}")
    logger.info(f"Time window: {settings.cluster_time_window_days} days")

    try:
        init_connection_pool()
        logger.info("Database connection pool initialized")

        # TODO: Implement ingestion pipeline
        # 1. Load sources from database
        # 2. For each source: fetch RSS, normalize, extract, deduplicate
        # 3. Persist articles
        # 4. Recompute clusters
        # 5. Update job status

        logger.info("Ingestion pipeline not yet implemented")
        return 0

    except Exception as e:
        logger.exception("Ingestion failed")
        return 1
    finally:
        close_connection_pool()
        logger.info("Database connection pool closed")


if __name__ == "__main__":
    sys.exit(main())