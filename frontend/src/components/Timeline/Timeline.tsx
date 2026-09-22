'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { TimelineItem } from '@/types/api';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';

interface TimelineProps {
  data: TimelineItem[];
  loading: boolean;
  error: string | null;
  onClusterClick: (clusterId: string) => void;
  selectedClusterId: string | null;
  selectedSources: string[];
  allSources: string[];
  hasLoadedOnce: boolean;
  onRefresh: () => void;
  onClearFilters: () => void;
}

type RangeOption = '24h' | '3d' | '7d' | '30d';
type SortOption = 'active' | 'recent';

const sourceTone: Record<string, string> = {
  BBC: 'source-bbc',
  NPR: 'source-npr',
  'The Guardian': 'source-guardian',
};

function safeTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatDay(value: number) {
  try { return format(new Date(value), 'MMM d'); } catch { return '—'; }
}

function formatDateTime(value: string) {
  try { return format(new Date(value), 'MMM d • h:mm a'); } catch { return value; }
}

function getIntensity(value: number) {
  const intensity = Number(value || 0);
  if (intensity >= 0.7) return { label: 'High', tone: 'intensity-high' };
  if (intensity >= 0.4) return { label: 'Medium', tone: 'intensity-medium' };
  return { label: 'Low', tone: 'intensity-low' };
}

export function Timeline({
  data,
  loading,
  error,
  onClusterClick,
  selectedClusterId,
  selectedSources,
  allSources,
  hasLoadedOnce,
  onRefresh,
  onClearFilters,
}: TimelineProps) {
  const [range, setRange] = useState<RangeOption>('7d');
  const [sort, setSort] = useState<SortOption>('active');
  const [showAll, setShowAll] = useState(false);

  const visibleData = useMemo(() => {
    if (!data.length) return [];

    const newest = Math.max(...data.map((item) => safeTime(item.endTime)));
    const rangeMs: Record<RangeOption, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = newest - rangeMs[range];

    return [...data]
      .filter((item) => safeTime(item.endTime) >= cutoff)
      .sort((a, b) => {
        if (sort === 'recent') {
          return safeTime(b.endTime) - safeTime(a.endTime);
        }
        return Number(b.articleCount || 0) - Number(a.articleCount || 0)
          || safeTime(b.endTime) - safeTime(a.endTime);
      });
  }, [data, range, sort]);

  const shown = showAll ? visibleData : visibleData.slice(0, 12);

  const extent = useMemo(() => {
    if (!visibleData.length) return { min: 0, max: 1 };
    const values = visibleData.flatMap((item) => [safeTime(item.startTime), safeTime(item.endTime)]);
    const min = Math.min(...values);
    const rawMax = Math.max(...values);
    return { min, max: rawMax === min ? min + 60 * 60 * 1000 : rawMax };
  }, [visibleData]);

  const timeRange = Math.max(extent.max - extent.min, 1);

  const ticks = useMemo(() => {
    if (!visibleData.length) return [];
    return Array.from({ length: 6 }, (_, index) => {
      const ratio = index / 5;
      const value = extent.min + ratio * timeRange;
      return { left: ratio * 100, label: formatDay(value) };
    });
  }, [extent.min, timeRange, visibleData.length]);

  if (loading && !hasLoadedOnce) return <LoadingState />;

  if (error) {
    return (
      <section className="timeline-panel" aria-label="News story timeline">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </section>
    );
  }

  if (!data.length) {
    return (
      <section className="timeline-panel" aria-label="News story timeline">
        <EmptyState
          hasFilters={selectedSources.length > 0 && selectedSources.length < allSources.length}
          onClearFilters={selectedSources.length > 0 ? onClearFilters : undefined}
          onRefresh={onRefresh}
        />
      </section>
    );
  }

  if (!visibleData.length) {
    return (
      <section className="timeline-panel" aria-label="News story timeline">
        <div className="timeline-head compact">
          <div>
            <div className="eyebrow">Story timeline</div>
            <h2 id="timeline-title">No stories in this window</h2>
            <p>Try a wider time range or a different source selection.</p>
          </div>
        </div>
        <div className="state-card small-state">
          <div className="state-icon">⌁</div>
          <div><h3>No stories match this time range</h3><p>The current filters leave no story clusters to plot.</p><button type="button" onClick={() => setRange('7d')}>Back to 7 days</button></div>
        </div>
      </section>
    );
  }

  return (
    <section className="timeline-panel" aria-labelledby="timeline-title">
      <div className="timeline-head">
        <div>
          <div className="eyebrow">Story timeline</div>
          <div className="timeline-title-row">
            <h2 id="timeline-title">When each story was active</h2>
            <span className="story-count">{shown.length} of {visibleData.length} stories</span>
          </div>
          <p>Each row is a topic cluster. Bar length shows the active window; activity reflects article volume.</p>
        </div>

        <div className="intensity-legend" aria-label="Activity legend">
          <span><i className="legend-dot intensity-low" /> Low</span>
          <span><i className="legend-dot intensity-medium" /> Medium</span>
          <span><i className="legend-dot intensity-high" /> High</span>
        </div>
      </div>

      <div className="timeline-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-label">Time range</span>
          <div className="range-controls" role="group" aria-label="Time range">
            {(['24h', '3d', '7d', '30d'] as RangeOption[]).map((option) => (
              <button
                type="button"
                key={option}
                className={`toolbar-segment ${range === option ? 'is-active' : ''}`}
                aria-pressed={range === option}
                onClick={() => { setRange(option); setShowAll(false); }}
              >{option}</button>
            ))}
          </div>
        </div>

        <label className="sort-control">
          <span>Sort by</span>
          <select value={sort} onChange={(event) => { setSort(event.target.value as SortOption); setShowAll(false); }}>
            <option value="active">Most active</option>
            <option value="recent">Most recent</option>
          </select>
        </label>
      </div>

      <div className="timeline-scroll" role="region" aria-label="Scrollable story timeline">
        <div className="timeline-grid">
          <div className="timeline-axis-row">
            <div className="timeline-sticky-cell axis-label">STORY</div>
            <div className="timeline-track-axis">
              {ticks.map((tick) => (
                <div key={`${tick.left}-${tick.label}`} className="axis-tick" style={{ left: `${tick.left}%` }}>
                  <span>{tick.label}</span>
                </div>
              ))}
            </div>
          </div>

          {shown.map((item) => {
            const start = safeTime(item.startTime);
            const end = safeTime(item.endTime);
            const left = Math.max(0, Math.min(97, ((start - extent.min) / timeRange) * 100));
            const rawWidth = ((Math.max(end, start + 30 * 60 * 1000) - start) / timeRange) * 100;
            const width = Math.min(Math.max(rawWidth, 3.5), Math.max(3.5, 100 - left));
            const activity = getIntensity(item.intensity);
            const selected = selectedClusterId === item.clusterId;
            const articleCount = Number(item.articleCount || 0);

            return (
              <div className={`timeline-row ${selected ? 'is-selected' : ''}`} key={item.clusterId}>
                <div className="timeline-sticky-cell story-meta">
                  <button type="button" className="story-meta-button" onClick={() => onClusterClick(item.clusterId)} aria-label={`Open ${item.label}`}>
                    <span className="story-meta-title" title={item.label}>{item.label}</span>
                    <span className="story-meta-subline">
                      <span className={`source-badge ${sourceTone[item.sources[0]] || 'source-default'}`}>{item.sources[0] || 'Unknown'}</span>
                      {item.sources.length > 1 && <span className="source-more">+{item.sources.length - 1}</span>}
                      <span className="bullet">•</span>
                      <span>{articleCount} article{articleCount === 1 ? '' : 's'}</span>
                    </span>
                  </button>
                  <span className={`intensity-badge ${activity.tone}`}>{activity.label}</span>
                </div>

                <div className="timeline-track-cell">
                  {ticks.map((tick) => <span key={tick.left} className="timeline-grid-line" style={{ left: `${tick.left}%` }} aria-hidden="true" />)}
                  <button
                    type="button"
                    className={`timeline-bar ${activity.tone} ${selected ? 'is-selected' : ''}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onClick={() => onClusterClick(item.clusterId)}
                    aria-pressed={selected}
                    aria-label={`${item.label}. ${articleCount} article${articleCount === 1 ? '' : 's'}. ${activity.label} activity. ${formatDateTime(item.startTime)} to ${formatDateTime(item.endTime)}.`}
                  >
                    <span className="bar-label">{width > 18 ? item.label : 'Story'}</span>
                    <span className="bar-count">{articleCount}</span>
                    <span className="story-tooltip" role="tooltip">
                      <strong>{item.label}</strong>
                      <span>{articleCount} article{articleCount === 1 ? '' : 's'} · {item.sources.join(' • ')}</span>
                      <span>{formatDateTime(item.startTime)} → {formatDateTime(item.endTime)}</span>
                    </span>
                  </button>
                  <div className="track-times" aria-hidden="true"><span>{formatDateTime(item.startTime)}</span><span>{formatDateTime(item.endTime)}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="timeline-footer">
        <span>{showAll ? `Showing all ${visibleData.length} stories in this window.` : `Showing the 12 most relevant stories of ${visibleData.length} in this window.`}</span>
        {visibleData.length > 12 && (
          <button type="button" className="show-all-button" onClick={() => setShowAll((value) => !value)}>
            {showAll ? 'Show fewer stories' : `View all ${visibleData.length} stories`} <span aria-hidden="true">{showAll ? '↑' : '→'}</span>
          </button>
        )}
      </div>
    </section>
  );
}
