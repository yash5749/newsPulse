export interface Source {
  id: string;
  name: string;
}

export interface Cluster {
  id: string;
  label: string;
  articleCount: number;
  startTime: string;
  endTime: string;
  sources: string[];
}

export interface Article {
  id: string;
  title: string;
  sourceName: string;
  publishedAt: string;
  url: string;
}

export interface ClusterDetail extends Cluster {
  articles: Article[];
}

export interface TimelineItem {
  clusterId: string;
  label: string;
  startTime: string;
  endTime: string;
  articleCount: number;
  intensity: number;
  sources: string[];
}

export interface IngestJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: string | null;
  completedAt: string | null;
  articlesFetched: number;
  articlesInserted: number;
  articlesUpdated: number;
  clustersCreated: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
}
