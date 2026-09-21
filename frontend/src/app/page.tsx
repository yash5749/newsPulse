'use client';

import { useState } from 'react';
import { useTimeline, useSources, useClusterDetail } from '@/hooks/useApi';
import { Timeline } from '@/components/Timeline';
import { ClusterDetail } from '@/components/ClusterDetail';
import { SourceFilter } from '@/components/SourceFilter';
import { RefreshButton } from '@/components/RefreshButton';
import type { TimelineItem, Source } from '@/types/api';

export default function Home() {
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const { data: sources, loading: sourcesLoading, error: sourcesError } = useSources();
  const { data: timelineData, loading, error, refetch, selectedSources, toggleSource } = useTimeline();
  const { data: clusterDetail, loading: clusterLoading, error: clusterError } = useClusterDetail(selectedClusterId);

  const handleClusterClick = (clusterId: string) => {
    setSelectedClusterId(clusterId);
  };

  const handleCloseCluster = () => {
    setSelectedClusterId(null);
  };

  const handleRefreshComplete = () => {
    refetch();
  };

  if (sourcesLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading sources...</p>
        </div>
      </div>
    );
  }

  if (sourcesError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load sources: {sourcesError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">News Pulse</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Topic-clustered news timeline</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full sm:w-auto">
              <SourceFilter
                sources={sources}
                selectedSources={selectedSources}
                onToggleSource={toggleSource}
              />
              <RefreshButton onRefreshComplete={handleRefreshComplete} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
            <p className="text-red-700 dark:text-red-300">Failed to load timeline: {error}</p>
            <button
              onClick={refetch}
              className="mt-2 text-sm text-red-700 dark:text-red-300 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        <Timeline
          data={timelineData}
          onClusterClick={handleClusterClick}
          selectedClusterId={selectedClusterId}
        />

        {timelineData.length === 0 && !loading && !error && (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            <p className="text-lg">No clusters found</p>
            <p className="mt-2">Try clicking "Refresh Data" to fetch the latest news</p>
          </div>
        )}
      </main>

      <ClusterDetail
        cluster={clusterDetail}
        onClose={handleCloseCluster}
      />
    </div>
  );
}