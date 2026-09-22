'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ClusterDetail, IngestJob, Source, TimelineItem } from '@/types/api';

export function useTimeline() {
  const [data, setData] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchTimeline = useCallback(async (sources: string[]) => api.getTimeline(sources), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const timeline = await fetchTimeline(selectedSources);
        if (!cancelled) {
          setData(timeline);
          setHasLoadedOnce(true);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load timeline');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [fetchTimeline, selectedSources]);

  const toggleSource = useCallback((sourceName: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceName)
        ? prev.filter((source) => source !== sourceName)
        : [...prev, sourceName],
    );
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const timeline = await fetchTimeline(selectedSources);
      setData(timeline);
      setHasLoadedOnce(true);
      return timeline;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load timeline');
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchTimeline, selectedSources]);

  return {
    data,
    loading,
    error,
    refetch,
    selectedSources,
    toggleSource,
    setSelectedSources,
    hasLoadedOnce,
  };
}

export function useClusterDetail(clusterId: string | null) {
  const [data, setData] = useState<ClusterDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!clusterId) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const cluster = await api.getCluster(clusterId);
        if (!cancelled) setData(cluster);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load story');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [clusterId]);

  return { data, loading, error };
}

export function useSources() {
  const [data, setData] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getSources()
      .then((sources) => { if (!cancelled) setData(sources); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load sources'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

export function useIngest() {
  const [job, setJob] = useState<IngestJob | null>(null);
  const [polling, setPolling] = useState(false);

  const triggerIngest = useCallback(async () => {
    const newJob = await api.triggerIngest();
    setJob(newJob);
    setPolling(newJob.status === 'queued' || newJob.status === 'running');
    return newJob;
  }, []);

  const pollStatus = useCallback(async (jobId: string) => {
    const status = await api.getIngestStatus(jobId);
    setJob(status);
    if (status.status === 'completed' || status.status === 'failed') setPolling(false);
    return status;
  }, []);

  return { job, polling, triggerIngest, pollStatus };
}
