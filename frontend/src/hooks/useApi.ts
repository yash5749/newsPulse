'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { TimelineItem, Source, ClusterDetail, IngestJob } from '@/types/api';

export function useTimeline(initialSources?: string[]) {
  const [data, setData] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>(initialSources || []);

  const fetchTimeline = useCallback(async (sources: string[]): Promise<TimelineItem[]> => {
    const timeline = await api.getTimeline(sources);
    return timeline;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const timeline = await fetchTimeline(selectedSources);
        if (!cancelled) setData(timeline);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load timeline');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [fetchTimeline, selectedSources]);

  const toggleSource = useCallback((sourceName: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceName)
        ? prev.filter((s) => s !== sourceName)
        : [...prev, sourceName]
    );
  }, []);

  return {
    data,
    loading,
    error,
    refetch: () => fetchTimeline(selectedSources),
    selectedSources,
    toggleSource,
    setSelectedSources,
  };
}

export function useClusterDetail(clusterId: string | null) {
  const [data, setData] = useState<ClusterDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCluster = useCallback(async (id: string): Promise<ClusterDetail> => {
    const cluster = await api.getCluster(id);
    return cluster;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (clusterId) {
        setLoading(true);
        setError(null);
        try {
          const cluster = await fetchCluster(clusterId);
          if (!cancelled) setData(cluster);
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load cluster');
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else {
        if (!cancelled) setData(null);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [clusterId, fetchCluster]);

  return { data, loading, error, refetch: fetchCluster };
}

export function useSources() {
  const [data, setData] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getSources()
      .then((sources) => {
        if (!cancelled) setData(sources);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load sources');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

export function useIngest() {
  const [job, setJob] = useState<IngestJob | null>(null);
  const [polling, setPolling] = useState(false);

  const triggerIngest = useCallback(async () => {
    try {
      const newJob = await api.triggerIngest();
      setJob(newJob);
      setPolling(true);
      return newJob;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to trigger ingestion');
    }
  }, []);

  const pollStatus = useCallback(async (jobId: string) => {
    try {
      const status = await api.getIngestStatus(jobId);
      setJob(status);
      if (status.status === 'completed' || status.status === 'failed') {
        setPolling(false);
      }
      return status;
    } catch (err) {
      setPolling(false);
      throw err;
    }
  }, []);

  return { job, polling, triggerIngest, pollStatus, setJob, setPolling };
}