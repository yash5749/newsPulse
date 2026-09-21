import type { Cluster, ClusterDetail, TimelineItem, IngestJob, Source, ApiResponse } from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  async getSources(): Promise<Source[]> {
    const data = await fetchJson<ApiResponse<Source[]>>(`${API_BASE}/sources`);
    return data.data;
  },

  async getClusters(): Promise<Cluster[]> {
    const data = await fetchJson<ApiResponse<Cluster[]>>(`${API_BASE}/clusters`);
    return data.data;
  },

  async getCluster(id: string): Promise<ClusterDetail> {
    const data = await fetchJson<ApiResponse<ClusterDetail>>(`${API_BASE}/clusters/${id}`);
    return data.data;
  },

  async getTimeline(sources?: string[]): Promise<TimelineItem[]> {
    const params = new URLSearchParams();
    if (sources && sources.length > 0) {
      params.set('sources', sources.join(','));
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await fetchJson<ApiResponse<TimelineItem[]>>(`${API_BASE}/timeline${query}`);
    return data.data;
  },

  async triggerIngest(): Promise<IngestJob> {
    const data = await fetchJson<ApiResponse<IngestJob>>(`${API_BASE}/ingest/trigger`, {
      method: 'POST',
    });
    return data.data;
  },

  async getIngestStatus(jobId: string): Promise<IngestJob> {
    const data = await fetchJson<ApiResponse<IngestJob>>(`${API_BASE}/ingest/status/${jobId}`);
    return data.data;
  },
};