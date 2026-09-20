export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export type ExtractionStatus = 'SUCCESS' | 'FALLBACK' | 'FAILED' | 'PENDING';

export interface Source {
  id: string;
  name: string;
  rss_url: string;
  base_url: string | null;
  created_at: Date;
}

export interface Article {
  id: string;
  source_id: string;
  external_id: string | null;
  url: string;
  canonical_url: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  published_at: Date | null;
  fetched_at: Date;
  extraction_status: ExtractionStatus;
  content_hash: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Cluster {
  id: string;
  label: string;
  representative_article_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ClusterArticle {
  cluster_id: string;
  article_id: string;
  similarity_score: number;
}

export interface IngestJob {
  id: string;
  status: JobStatus;
  started_at: Date | null;
  completed_at: Date | null;
  articles_fetched: number;
  articles_inserted: number;
  articles_updated: number;
  clusters_created: number;
  error_message: string | null;
  created_at: Date;
}

export interface ClusterWithDetails extends Cluster {
  article_count: number;
  start_time: Date | null;
  end_time: Date | null;
  sources: string[];
}

export interface ClusterDetail extends Cluster {
  articles: ArticleWithSource[];
}

export interface ArticleWithSource extends Article {
  source_name: string;
}

export interface TimelineItem {
  cluster_id: string;
  label: string;
  start_time: Date;
  end_time: Date;
  article_count: number;
  intensity: number;
  sources: string[];
}