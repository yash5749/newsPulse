import hashlib
import logging
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.database.models import Article, Source, NormalizedArticle, ExtractionStatus, IngestJob, JobStatus
from app.database.connection import get_connection, get_cursor
from app.normalization.url_canonicalizer import canonicalize_url

logger = logging.getLogger(__name__)


def compute_content_hash(title: str, summary: str, article_url: str) -> str:
    content = f"{title}|{summary}|{article_url}"
    return hashlib.sha256(content.encode('utf-8')).hexdigest()[:32]


def _row_to_source(row) -> Source:
    return Source(id=row['id'], name=row['name'], rss_url=row['rss_url'], base_url=row['base_url'], created_at=row['created_at'])


def _row_to_article(row, source_id: UUID) -> Article:
    return Article(
        id=row['id'], source_id=source_id, external_id=row['external_id'], url=row['url'],
        canonical_url=row['canonical_url'], title=row['title'], summary=row['summary'], body=row['body'],
        published_at=row['published_at'], fetched_at=row['fetched_at'],
        extraction_status=ExtractionStatus(row['extraction_status']),
        content_hash=row['content_hash'], created_at=row['created_at'], updated_at=row['updated_at']
    )


def _row_to_ingest_job(row) -> IngestJob:
    return IngestJob(
        id=row['id'], status=JobStatus(row['status']), started_at=row['started_at'], completed_at=row['completed_at'],
        articles_fetched=row['articles_fetched'], articles_inserted=row['articles_inserted'],
        articles_updated=row['articles_updated'], clusters_created=row['clusters_created'],
        error_message=row['error_message'], created_at=row['created_at']
    )


class ArticleRepository:
    def __init__(self, pool):
        self.pool = pool

    def get_source_by_name(self, name: str) -> Optional[Source]:
        with get_cursor() as cur:
            cur.execute("SELECT id, name, rss_url, base_url, created_at FROM sources WHERE name = %s", (name,))
            row = cur.fetchone()
            if row:
                return _row_to_source(row)
        return None

    def get_all_sources(self) -> List[Source]:
        with get_cursor() as cur:
            cur.execute("SELECT id, name, rss_url, base_url, created_at FROM sources ORDER BY name")
            return [_row_to_source(row) for row in cur.fetchall()]

    def upsert_article(self, source_id: UUID, article: NormalizedArticle) -> tuple[Article, bool]:
        canonical_url = canonicalize_url(article.article_url)
        content_hash = compute_content_hash(article.title, article.summary, canonical_url)
        fetched_at = datetime.now()

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id, external_id, url, canonical_url, title, summary, body, 
                              published_at, fetched_at, extraction_status, content_hash, created_at, updated_at
                       FROM articles WHERE source_id = %s AND external_id = %s""",
                    (source_id, article.external_id)
                )
                existing = cur.fetchone()

                if existing:
                    cur.execute(
                        """UPDATE articles SET 
                               url = %s, canonical_url = %s, title = %s, summary = %s, 
                               body = %s, published_at = %s, fetched_at = %s,
                               extraction_status = %s, content_hash = %s, updated_at = NOW()
                           WHERE id = %s
                           RETURNING id, external_id, url, canonical_url, title, summary, body,
                                     published_at, fetched_at, extraction_status, content_hash, created_at, updated_at""",
                        (article.article_url, canonical_url, article.title, article.summary,
                         article.body, article.published_at, fetched_at,
                         article.extraction_status.value, content_hash, existing['id'])
                    )
                    row = cur.fetchone()
                    is_new = False
                else:
                    cur.execute(
                        """INSERT INTO articles (source_id, external_id, url, canonical_url, title, summary, body,
                                                 published_at, fetched_at, extraction_status, content_hash)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                           RETURNING id, external_id, url, canonical_url, title, summary, body,
                                     published_at, fetched_at, extraction_status, content_hash, created_at, updated_at""",
                        (source_id, article.external_id, article.article_url, canonical_url,
                         article.title, article.summary, article.body, article.published_at,
                         fetched_at, article.extraction_status.value, content_hash)
                    )
                    row = cur.fetchone()
                    is_new = True

                return _row_to_article(row, source_id), is_new

    def get_articles_for_clustering(self, days: int = 7) -> List[dict]:
        with get_cursor() as cur:
            cur.execute(
                """SELECT id, source_id, title, summary, body, published_at
                     FROM articles 
                     WHERE published_at >= NOW() - INTERVAL '%s days'
                     ORDER BY published_at DESC""",
                (days,)
            )
            return [dict(row) for row in cur.fetchall()]


class JobRepository:
    def __init__(self, pool):
        self.pool = pool

    def create_job(self) -> IngestJob:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO ingest_jobs (status, articles_fetched, articles_inserted, articles_updated)
                       VALUES (%s, 0, 0, 0)
                       RETURNING id, status, started_at, completed_at, articles_fetched, articles_inserted, articles_updated, clusters_created, error_message, created_at""",
                    (JobStatus.QUEUED.value,)
                )
                row = cur.fetchone()
                return _row_to_ingest_job(row)

    def update_job_running(self, job_id: UUID):
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE ingest_jobs SET status = %s, started_at = NOW() WHERE id = %s",
                    (JobStatus.RUNNING.value, str(job_id))
                )

    def complete_job(self, job_id: UUID, fetched: int, inserted: int, updated: int, clusters: int = 0, error: str = None):
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """UPDATE ingest_jobs SET 
                           status = %s, completed_at = NOW(), articles_fetched = %s, 
                           articles_inserted = %s, articles_updated = %s, clusters_created = %s, error_message = %s
                       WHERE id = %s""",
                    (JobStatus.COMPLETED.value if not error else JobStatus.FAILED.value,
                     fetched, inserted, updated, clusters, error, str(job_id))
                )

    def get_job(self, job_id: UUID) -> Optional[IngestJob]:
        with get_cursor() as cur:
            cur.execute(
                "SELECT id, status, started_at, completed_at, articles_fetched, articles_inserted, articles_updated, clusters_created, error_message, created_at FROM ingest_jobs WHERE id = %s",
                (str(job_id),)
            )
            row = cur.fetchone()
            if row:
                return _row_to_ingest_job(row)
        return None