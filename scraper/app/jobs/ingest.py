import logging
from typing import List
from datetime import datetime, timezone
from uuid import UUID

from app.database.connection import get_connection_pool, close_connection_pool as close_pool
from app.database.models import Source, NormalizedArticle, ExtractionStatus
from app.database.operations import ArticleRepository, JobRepository
from app.feeds.adapter import fetch_and_parse_feed
from app.extraction.extractor import ArticleExtractor
from app.normalization.url_canonicalizer import canonicalize_url
from app.clustering.clusterer import TFIDFClusterer, ArticleForClustering
from app.clustering.operations import persist_clusters, clear_clusters

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class IngestionPipeline:
    def __init__(self):
        self.pool = get_connection_pool()
        self.article_repo = ArticleRepository(self.pool)
        self.job_repo = JobRepository(self.pool)

    def run_ingestion(self, job_id: str = None) -> None:
        if job_id:
            # Use existing job ID from Node.js backend
            from uuid import UUID
            job = self.job_repo.get_job(UUID(job_id))
            if not job:
                logger.warning(f"Job {job_id} not found, creating new job")
                job = self.job_repo.create_job()
        else:
            job = self.job_repo.create_job()
        logger.info(f"Using ingestion job: {job.id}")

        try:
            self.job_repo.update_job_running(job.id)

            sources = self.article_repo.get_all_sources()
            logger.info(f"Found {len(sources)} sources")

            total_fetched = 0
            total_inserted = 0
            total_updated = 0

            with ArticleExtractor(timeout=30) as extractor:
                for source in sources:
                    try:
                        fetched, inserted, updated = self.process_source(source, extractor)
                        total_fetched += fetched
                        total_inserted += inserted
                        total_updated += updated
                    except Exception as e:
                        logger.error(f"Failed to process source {source.name}: {e}")
                        continue

            logger.info(f"Ingestion complete: fetched={total_fetched}, inserted={total_inserted}, updated={total_updated}")
            
            clusters_created = self.run_clustering()
            
            self.job_repo.complete_job(job.id, total_fetched, total_inserted, total_updated, clusters=clusters_created)

        except Exception as e:
            logger.error(f"Ingestion job failed: {e}")
            self.job_repo.complete_job(job.id, 0, 0, 0, clusters=0, error=str(e))
        finally:
            close_pool()

    def run_clustering(self) -> int:
        logger.info("Starting clustering...")
        try:
            clear_clusters()
            articles = self.article_repo.get_articles_for_clustering()
            logger.info(f"Retrieved {len(articles)} articles for clustering")
            
            if not articles:
                logger.warning("No articles to cluster")
                return 0
            
            cluster_articles = [
                ArticleForClustering(
                    id=a['id'],
                    title=a['title'] or '',
                    summary=a['summary'] or '',
                    source_id=a['source_id'],
                    published_at=a['published_at'].isoformat() if a['published_at'] else '',
                )
                for a in articles
            ]
            
            clusterer = TFIDFClusterer()
            clusters = clusterer.cluster(cluster_articles)
            persist_clusters(clusters)
            
            logger.info(f"Clustering complete: created {len(clusters)} clusters")
            return len(clusters)
        except Exception as e:
            logger.error(f"Clustering failed: {e}")
            return 0

    def process_source(self, source: Source, extractor: ArticleExtractor) -> tuple[int, int, int]:
        logger.info(f"Processing source: {source.name}")

        articles = fetch_and_parse_feed(source.rss_url, source.name)
        logger.info(f"[{source.name}] Normalized {len(articles)} articles")

        fetched = 0
        inserted = 0
        updated = 0

        for normalized in articles:
            fetched += 1

            if not normalized.article_url:
                logger.warning(f"[{source.name}] Skipping article without URL: {normalized.title[:50]}")
                continue

            if normalized.extraction_status == ExtractionStatus.PENDING:
                logger.info(f"[{source.name}] Extracting full article: {normalized.article_url}")
                body, status = extractor.extract(normalized.article_url)
                normalized.body = body
                normalized.extraction_status = status
                if status == ExtractionStatus.FAILED:
                    logger.warning(f"[{source.name}] Extraction failed for {normalized.article_url}")

            try:
                article, is_new = self.article_repo.upsert_article(source.id, normalized)
                if is_new:
                    inserted += 1
                    logger.debug(f"[{source.name}] Inserted: {article.title[:60]}")
                else:
                    updated += 1
                    logger.debug(f"[{source.name}] Updated: {article.title[:60]}")
            except Exception as e:
                logger.error(f"[{source.name}] Failed to upsert article: {e}")

        logger.info(f"[{source.name}] Done: fetched={fetched}, inserted={inserted}, updated={updated}")
        return fetched, inserted, updated


def main():
    pipeline = IngestionPipeline()
    pipeline.run_ingestion()


if __name__ == "__main__":
    main()