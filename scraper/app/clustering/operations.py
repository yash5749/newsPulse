import logging
import uuid
from typing import Optional
from datetime import datetime, timezone

from app.database.connection import get_cursor
from app.clustering.clusterer import ClusterResult, ClusterArticle

logger = logging.getLogger(__name__)


def persist_clusters(clusters: list[ClusterResult]) -> None:
    if not clusters:
        logger.info("No clusters to persist")
        return

    with get_cursor() as cur:
        # Delete existing clusters and their assignments in a single transaction
        # This ensures we don't leave the database in an inconsistent state if clustering fails
        cur.execute("DELETE FROM cluster_articles")
        cur.execute("DELETE FROM clusters")

        for cluster in clusters:
            cluster_id = cluster.id
            label = cluster.label
            representative_article_id = cluster.representative_article_id
            now = datetime.now(timezone.utc)

            cur.execute(
                """
                INSERT INTO clusters (id, label, representative_article_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (cluster_id, label, representative_article_id, now, now),
            )

            for cluster_article in cluster.articles:
                cur.execute(
                    """
                    INSERT INTO cluster_articles (cluster_id, article_id, similarity_score)
                    VALUES (%s, %s, %s)
                    """,
                    (cluster_id, cluster_article.article_id, cluster_article.similarity_score),
                )

        logger.info(f"Persisted {len(clusters)} clusters with article assignments")


def get_clusters_with_articles(limit: int = 50) -> list[dict]:
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT c.id, c.label, c.representative_article_id, c.created_at, c.updated_at,
                   COUNT(ca.article_id) as article_count,
                   MIN(a.published_at) as start_time,
                   MAX(a.published_at) as end_time,
                   ARRAY_AGG(DISTINCT s.name) as sources
            FROM clusters c
            LEFT JOIN cluster_articles ca ON c.id = ca.cluster_id
            LEFT JOIN articles a ON ca.article_id = a.id
            LEFT JOIN sources s ON a.source_id = s.id
            GROUP BY c.id, c.label, c.representative_article_id, c.created_at, c.updated_at
            ORDER BY c.created_at DESC
            LIMIT %s
            """,
            (limit,),
        )
        return cur.fetchall()


def get_cluster_by_id(cluster_id: str) -> Optional[dict]:
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT c.id, c.label, c.representative_article_id, c.created_at, c.updated_at,
                   COUNT(ca.article_id) as article_count,
                   MIN(a.published_at) as start_time,
                   MAX(a.published_at) as end_time,
                   ARRAY_AGG(DISTINCT s.name) as sources
            FROM clusters c
            LEFT JOIN cluster_articles ca ON c.id = ca.cluster_id
            LEFT JOIN articles a ON ca.article_id = a.id
            LEFT JOIN sources s ON a.source_id = s.id
            WHERE c.id = %s
            GROUP BY c.id, c.label, c.representative_article_id, c.created_at, c.updated_at
            """,
            (cluster_id,),
        )
        return cur.fetchone()


def get_cluster_articles(cluster_id: str) -> list[dict]:
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT a.id, a.title, a.summary, a.body, a.url, a.published_at, a.source_id, s.name as source_name
            FROM articles a
            JOIN cluster_articles ca ON a.id = ca.article_id
            JOIN sources s ON a.source_id = s.id
            WHERE ca.cluster_id = %s
            ORDER BY a.published_at ASC
            """,
            (cluster_id,),
        )
        return cur.fetchall()


def clear_clusters() -> int:
    with get_cursor() as cur:
        cur.execute("DELETE FROM cluster_articles")
        cur.execute("DELETE FROM clusters")
        return cur.rowcount