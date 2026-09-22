'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIngest } from '@/hooks/useApi';

interface RefreshButtonProps {
  onRefreshComplete: () => void;
}

export function RefreshButton({ onRefreshComplete }: RefreshButtonProps) {
  const { job, polling, triggerIngest, pollStatus } = useIngest();
  const [error, setError] = useState<string | null>(null);
  const onCompleteRef = useRef(onRefreshComplete);
  const pollRef = useRef(pollStatus);
  const completedJobRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { onCompleteRef.current = onRefreshComplete; }, [onRefreshComplete]);
  useEffect(() => { pollRef.current = pollStatus; }, [pollStatus]);

  useEffect(() => {
    if (!polling || !job?.id) return;

    const runPoll = async () => {
      try {
        await pollRef.current(job.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to check refresh status.');
      }
    };

    void runPoll();
    timerRef.current = setInterval(() => void runPoll(), 2500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [polling, job?.id]);

  useEffect(() => {
    if (job?.status === 'completed' && job.id !== completedJobRef.current) {
      completedJobRef.current = job.id;
      onCompleteRef.current();
    }
  }, [job?.id, job?.status]);

  const handleClick = useCallback(async () => {
    if (polling) return;
    setError(null);
    completedJobRef.current = null;
    try {
      const created = await triggerIngest();
      if (created.status === 'failed') setError(created.errorMessage || 'Refresh failed to start.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start refresh.');
    }
  }, [polling, triggerIngest]);

  const busy = polling || job?.status === 'queued' || job?.status === 'running';
  const completed = job?.status === 'completed';
  const failed = job?.status === 'failed';

  return (
    <div className="refresh-area">
      <button type="button" className={`refresh-button ${completed ? 'is-complete' : ''} ${busy ? 'is-busy' : ''}`} disabled={busy} onClick={handleClick} aria-busy={busy}>
        {busy ? <span className="refresh-spinner" aria-hidden="true" /> : <span aria-hidden="true">{completed ? '✓' : '↻'}</span>}
        {busy ? (job?.status === 'queued' ? 'Queued…' : 'Updating news…') : failed ? 'Retry refresh' : completed ? 'Updated just now' : 'Refresh data'}
      </button>
      {error && <div className="refresh-error" role="alert">{error}</div>}
    </div>
  );
}
