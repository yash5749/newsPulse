import hashlib
import logging
from typing import Optional
from app.database.models import NormalizedArticle
from app.normalization.url_canonicalizer import canonicalize_url

logger = logging.getLogger(__name__)


def compute_content_hash(title: str, summary: str, article_url: str) -> str:
    content = f"{title}|{summary}|{article_url}"
    return hashlib.sha256(content.encode('utf-8')).hexdigest()[:32]


def canonicalize_article(article: NormalizedArticle) -> NormalizedArticle:
    return NormalizedArticle(
        source=article.source,
        external_id=article.external_id,
        title=article.title,
        summary=article.summary,
        article_url=canonicalize_url(article.article_url),
        published_at=article.published_at,
        body=article.body,
        extraction_status=article.extraction_status,
    )


class Deduplicator:
    def __init__(self, pool):
        self.pool = pool

    def check_external_id_exists(self, source_id: str, external_id: str) -> Optional[str]:
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM articles WHERE source_id = %s AND external_id = %s",
                    (source_id, external_id)
                )
                row = cur.fetchone()
                return str(row[0]) if row else None

    def check_canonical_url_exists(self, source_id: str, canonical_url: str) -> Optional[str]:
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM articles WHERE source_id = %s AND canonical_url = %s",
                    (source_id, canonical_url)
                )
                row = cur.fetchone()
                return str(row[0]) if row else None

    def check_similar_exists(self, source_id: str, title: str, published_at) -> Optional[str]:
        if not published_at:
            return None
        from datetime import timedelta
        window_start = published_at - timedelta(hours=24)
        window_end = published_at + timedelta(hours=24)
        with self.pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT id FROM articles 
                       WHERE source_id = %s 
                       AND published_at BETWEEN %s AND %s
                       AND similarity(title, %s) > 0.8
                       ORDER BY published_at DESC LIMIT 1""",
                    (source_id, window_start, window_end, title)
                )
                row = cur.fetchone()
                return str(row[0]) if row else None

    def is_duplicate(self, source_id: str, article: NormalizedArticle) -> tuple[bool, Optional[str], str]:
        canonical = canonicalize_article(article)
        article.content_hash = compute_content_hash(canonical.title, canonical.summary, canonical.article_url)

        existing_id = self.check_external_id_exists(source_id, canonical.external_id)
        if existing_id:
            return True, existing_id, "external_id"

        existing_id = self.check_canonical_url_exists(source_id, canonical.article_url)
        if existing_id:
            return True, existing_id, "canonical_url"

        existing_id = self.check_similar_exists(source_id, canonical.title, canonical.published_at)
        if existing_id:
            return True, existing_id, "similar_title_time"

        return False, None, ""