'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTimeline, useSources, useClusterDetail } from '@/hooks/useApi';
import { Header } from '@/components/Header';
import { SummaryStats } from '@/components/SummaryStats';
import { SourceFilter } from '@/components/SourceFilter';
import { Timeline } from '@/components/Timeline/Timeline';
import { ClusterDetail } from '@/components/ClusterDetail';

export default function Home() {
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const initializedSources = useRef(false);
  const { data: sources, loading: sourcesLoading, error: sourcesError } = useSources();
  const { data: timelineData, loading, error, refetch, selectedSources, toggleSource, setSelectedSources, hasLoadedOnce } = useTimeline();
  const { data: clusterDetail, loading: clusterLoading, error: clusterError } = useClusterDetail(selectedClusterId);

  useEffect(() => {
    if (!sources.length || initializedSources.current) return;
    initializedSources.current = true;
    setSelectedSources(sources.map((source) => source.name));
  }, [sources, setSelectedSources]);

  const lastUpdated = useMemo(() => {
    if (!timelineData.length) return null;
    const latest = Math.max(...timelineData.map((item) => new Date(item.endTime).getTime()));
    return Number.isFinite(latest) ? new Date(latest) : null;
  }, [timelineData]);

  const refreshTimeline = useCallback(() => {
    void refetch();
  }, [refetch]);

  const clearFilters = useCallback(() => {
    setSelectedSources(sources.map((source) => source.name));
  }, [sources, setSelectedSources]);

  const openCluster = useCallback((clusterId: string) => setSelectedClusterId(clusterId), []);
  const closeCluster = useCallback(() => setSelectedClusterId(null), []);

  if (sourcesLoading) {
    return <div className="app-shell"><div className="page-shell initial-loading"><div className="loading-brand"><span className="loading-mark" /> News Pulse</div><span className="skeleton loading-block" /></div></div>;
  }

  if (sourcesError) {
    return <div className="app-shell"><div className="initial-error"><div className="state-icon error">!</div><h1>News Pulse couldn't load</h1><p>We couldn't retrieve the available news sources.</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div></div>;
  }

  return (
    <div className="app-shell">
      <Header onRefreshComplete={refreshTimeline} />

      <main className="page-shell main-content">
        <section className="intro-card">
          <div className="intro-copy">
            <div className="eyebrow">Live news intelligence</div>
            <h1>Follow stories, not just headlines.</h1>
            <p>News Pulse groups related articles into topic clusters and places each story on a timeline, so you can see when it emerged, how long it stayed active, and which outlets covered it.</p>
          </div>
          <div className="read-guide">
            <div className="read-guide-label">How to read this</div>
            <strong>One row = one story.</strong>
            <span>Bar length shows its active window. Activity color shows relative coverage.</span>
          </div>
        </section>

        <SummaryStats data={timelineData} sourcesCount={sources.length} lastUpdated={lastUpdated} />

        <SourceFilter sources={sources} selectedSources={selectedSources} onToggleSource={toggleSource} />

        <Timeline
          data={timelineData}
          loading={loading}
          error={error}
          onClusterClick={openCluster}
          selectedClusterId={selectedClusterId}
          selectedSources={selectedSources}
          allSources={sources.map((source) => source.name)}
          hasLoadedOnce={hasLoadedOnce}
          onRefresh={refreshTimeline}
          onClearFilters={clearFilters}
        />

        <footer className="app-footer">
          <span>News Pulse</span>
          <span>RSS ingestion · topic clustering · timeline exploration</span>
          <span>{selectedSources.length} source{selectedSources.length === 1 ? '' : 's'} selected</span>
        </footer>
      </main>

      <ClusterDetail cluster={clusterDetail} loading={clusterLoading} error={clusterError} onClose={closeCluster} />
    </div>
  );
}
