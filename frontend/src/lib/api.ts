import type { ApiResponse, Article, Cluster, ClusterDetail, IngestJob, Source, TimelineItem } from '@/types/api';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

type WireArticle = Omit<Article, 'sourceName'> & { sourceName?: string; source?: string };
type WireTimelineItem = Omit<TimelineItem, 'articleCount' | 'intensity'> & {
  articleCount: number | string;
  intensity: number | string;
};
type WireCluster = Omit<Cluster, 'articleCount'> & { articleCount: number | string };
type WireIngestJob = Omit<IngestJob, 'articlesFetched' | 'articlesInserted' | 'articlesUpdated' | 'clustersCreated'> & {
  articlesFetched: number | string;
  articlesInserted: number | string;
  articlesUpdated: number | string;
  clustersCreated: number | string;
};

type WireClusterDetail = Omit<ClusterDetail, 'articles' | 'articleCount'> & {
  articleCount: number | string;
  articles: WireArticle[];
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(payload.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

const toArticle = (article: WireArticle): Article => ({
  id: article.id,
  title: article.title,
  sourceName: article.sourceName ?? article.source ?? 'Unknown source',
  publishedAt: article.publishedAt,
  url: article.url,
});

const toCluster = (cluster: WireCluster): Cluster => ({
  ...cluster,
  articleCount: Number(cluster.articleCount || 0),
});

const toTimelineItem = (item: WireTimelineItem): TimelineItem => ({
  ...item,
  articleCount: Number(item.articleCount || 0),
  intensity: Number(item.intensity || 0),
});

const toIngestJob = (job: WireIngestJob): IngestJob => ({
  ...job,
  articlesFetched: Number(job.articlesFetched || 0),
  articlesInserted: Number(job.articlesInserted || 0),
  articlesUpdated: Number(job.articlesUpdated || 0),
  clustersCreated: Number(job.clustersCreated || 0),
});

export const api = {
  async getSources(): Promise<Source[]> {
    const response = await fetchJson<ApiResponse<Source[]>>(`${API_BASE}/sources`);
    return response.data;
  },

  async getClusters(): Promise<Cluster[]> {
    const response = await fetchJson<ApiResponse<WireCluster[]>>(`${API_BASE}/clusters`);
    return response.data.map(toCluster);
  },

  async getCluster(id: string): Promise<ClusterDetail> {
    const response = await fetchJson<ApiResponse<WireClusterDetail>>(`${API_BASE}/clusters/${id}`);
    return {
      ...toCluster(response.data),
      articles: response.data.articles.map(toArticle),
    };
  },

  async getTimeline(sources?: string[]): Promise<TimelineItem[]> {
    const params = new URLSearchParams();
    if (sources && sources.length > 0) params.set('sources', sources.join(','));
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetchJson<ApiResponse<WireTimelineItem[]>>(`${API_BASE}/timeline${query}`);
    return response.data.map(toTimelineItem);
  },

  async triggerIngest(): Promise<IngestJob> {
    const response = await fetchJson<ApiResponse<WireIngestJob>>(`${API_BASE}/ingest/trigger`, { method: 'POST' });
    return toIngestJob(response.data);
  },

  async getIngestStatus(jobId: string): Promise<IngestJob> {
    const response = await fetchJson<ApiResponse<WireIngestJob>>(`${API_BASE}/ingest/status/${jobId}`);
    return toIngestJob(response.data);
  },
};
