import type {
  ClusterWithDetails,
  ArticleWithSource,
  IngestJob,
  TimelineItem,
} from '../types/database.js';

export function mapClusterToApi(cluster: ClusterWithDetails) {
  return {
    id: cluster.id,
    label: cluster.label,
    articleCount: cluster.article_count,
    startTime: cluster.start_time?.toISOString() ?? null,
    endTime: cluster.end_time?.toISOString() ?? null,
    sources: cluster.sources,
  };
}

export function mapClusterDetailToApi(cluster: ClusterWithDetails, articles: ArticleWithSource[]) {
  return {
    id: cluster.id,
    label: cluster.label,
    articleCount: cluster.article_count,
    startTime: cluster.start_time?.toISOString() ?? null,
    endTime: cluster.end_time?.toISOString() ?? null,
    sources: cluster.sources,
    representativeArticleId: cluster.representative_article_id,
    createdAt: cluster.created_at.toISOString(),
    updatedAt: cluster.updated_at.toISOString(),
    articles: articles.map(mapArticleToApi),
  };
}

export function mapArticleToApi(article: ArticleWithSource) {
  return {
    id: article.id,
    sourceId: article.source_id,
    sourceName: article.source_name,
    externalId: article.external_id,
    url: article.url,
    canonicalUrl: article.canonical_url,
    title: article.title,
    summary: article.summary,
    body: article.body,
    publishedAt: article.published_at?.toISOString() ?? null,
    fetchedAt: article.fetched_at.toISOString(),
    extractionStatus: article.extraction_status,
    contentHash: article.content_hash,
    createdAt: article.created_at.toISOString(),
    updatedAt: article.updated_at.toISOString(),
  };
}

export function mapTimelineItemToApi(item: TimelineItem) {
  return {
    clusterId: item.cluster_id,
    label: item.label,
    startTime: item.start_time.toISOString(),
    endTime: item.end_time.toISOString(),
    articleCount: item.article_count,
    intensity: item.intensity,
    sources: item.sources,
  };
}

export function mapIngestJobToApi(job: IngestJob) {
  return {
    id: job.id,
    status: job.status,
    startedAt: job.started_at?.toISOString() ?? null,
    completedAt: job.completed_at?.toISOString() ?? null,
    articlesFetched: job.articles_fetched,
    articlesInserted: job.articles_inserted,
    articlesUpdated: job.articles_updated,
    clustersCreated: job.clusters_created,
    errorMessage: job.error_message,
    createdAt: job.created_at.toISOString(),
  };
}

export function mapSourceToApi(source: { id: string; name: string }) {
  return {
    id: source.id,
    name: source.name,
  };
}