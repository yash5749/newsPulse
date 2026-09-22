'use client';

import type { TimelineItem } from '@/types/api';

interface SummaryStatsProps {
  data: TimelineItem[];
  sourcesCount: number;
  lastUpdated: Date | null;
}

function relativeTime(date: Date | null) {
  if (!date) return '—';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function SummaryStats({ data, sourcesCount, lastUpdated }: SummaryStatsProps) {
  const totalArticles = data.reduce((sum, item) => sum + Number(item.articleCount || 0), 0);
  const stats = [
    ['Stories', data.length.toLocaleString(), 'topic clusters', 'purple'],
    ['Articles', totalArticles.toLocaleString(), 'grouped articles', 'blue'],
    ['Sources', sourcesCount.toLocaleString(), 'available outlets', 'green'],
    ['Updated', relativeTime(lastUpdated), 'latest activity', 'orange'],
  ] as const;

  return (
    <section className="stats-grid" aria-label="News Pulse summary">
      {stats.map(([label, value, note, accent]) => (
        <article className="stat-card" key={label}>
          <span className={`stat-dot stat-dot-${accent}`} aria-hidden="true" />
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
          <div className="stat-note">{note}</div>
        </article>
      ))}
    </section>
  );
}
