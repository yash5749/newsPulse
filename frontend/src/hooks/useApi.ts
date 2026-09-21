'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { TimelineItem, Source, ClusterDetail, IngestJob } from '@/types/api';

export function useTimeline(initialSources?: string[]) {
  const [data, setData] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>(initialSources || []);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const timeline = await api.getTimeline(selectedSources);
      setData(timeline);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [selectedSources]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

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
    refetch: fetchTimeline,
    selectedSources,
    toggleSource,
    setSelectedSources,
  };
}

export function useClusterDetail(clusterId: string | null) {
  const [data, setData] = useState<ClusterDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCluster = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const cluster = await api.getCluster(id);
      setData(cluster);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cluster');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clusterId) {
      fetchCluster(clusterId);
    } else {
      setData(null);
    }
  }, [clusterId, fetchCluster]);

  return { data, loading, error, refetch: fetchCluster };
}

export function useSources() {
  const [data, setData] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api.getSources()
      .then((sources) => {
        if (mounted) setData(sources);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load sources');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
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