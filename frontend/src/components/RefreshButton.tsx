'use client';

import { useState, useEffect, useCallback } from 'react';
import { useIngest } from '@/hooks/useApi';
import type { IngestJob } from '@/types/api';

interface RefreshButtonProps {
  onRefreshComplete: () => void;
}

export function RefreshButton({ onRefreshComplete }: RefreshButtonProps) {
  const { job, polling, triggerIngest, pollStatus } = useIngest();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (polling && job) {
      const interval = setInterval(async () => {
        try {
          await pollStatus(job.id);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to poll status');
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [polling, job, pollStatus]);

  useEffect(() => {
    if (job?.status === 'completed') {
      onRefreshComplete();
    }
  }, [job, onRefreshComplete]);

  const handleRefresh = async () => {
    setError(null);
    try {
      await triggerIngest();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start ingestion');
    }
  };

  const getStatusText = () => {
    if (!job) return 'Refresh Data';
    switch (job.status) {
      case 'queued':
        return 'Queued...';
      case 'running':
        return `Running... (${job.articlesFetched} fetched)`;
      case 'completed':
        return `Done (${job.articlesInserted} new)`;
      case 'failed':
        return 'Failed';
      default:
        return 'Refresh Data';
    }
  };

  const getStatusColor = () => {
    if (!job) return 'bg-blue-600 hover:bg-blue-700';
    switch (job.status) {
      case 'queued':
      case 'running':
        return 'bg-amber-600 hover:bg-amber-700';
      case 'completed':
        return 'bg-green-600 hover:bg-green-700';
      case 'failed':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  const isDisabled = polling || job?.status === 'queued' || job?.status === 'running';

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={isDisabled}
        className={`px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getStatusColor()}`}
        aria-busy={polling}
        aria-live="polite"
      >
        {polling || job?.status === 'queued' || job?.status === 'running' ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {getStatusText()}
          </>
        ) : (
          'Refresh Data'
        )}
      </button>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      {job?.status === 'failed' && job.errorMessage && (
        <div className="text-sm text-red-600 dark:text-red-400" role="alert">
          Error: {job.errorMessage}
        </div>
      )}
    </div>
  );
}