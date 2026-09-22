'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import type { ClusterDetail as ClusterDetailData } from '@/types/api';

interface ClusterDetailProps {
  cluster: ClusterDetailData | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

const tone: Record<string, string> = { BBC: 'source-bbc', NPR: 'source-npr', 'The Guardian': 'source-guardian' };

function fmt(value: string) {
  try { return format(new Date(value), 'MMM d • h:mm a'); } catch { return value; }
}

export function ClusterDetail({ cluster, loading, error, onClose }: ClusterDetailProps) {
  useEffect(() => {
    if (!cluster && !loading) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', handler); };
  }, [cluster, loading, onClose]);

  if (!cluster && !loading) return null;

  return (
    <div className="drawer-overlay" onMouseDown={onClose}>
      <aside className="cluster-drawer" role="dialog" aria-modal="true" aria-labelledby="cluster-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="drawer-header">
          <div className="drawer-title-wrap">
            <div className="eyebrow">Story cluster</div>
            <h2 id="cluster-title">{cluster?.label || 'Loading story…'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close story details">×</button>
        </header>

        {loading && !cluster ? (
          <div className="drawer-loading"><span className="skeleton skeleton-drawer-title" /><span className="skeleton skeleton-drawer-copy" /><span className="skeleton skeleton-drawer-card" /><span className="skeleton skeleton-drawer-card" /></div>
        ) : error ? (
          <div className="drawer-error"><strong>Couldn't load this story.</strong><p>{error}</p></div>
        ) : cluster ? (
          <div className="drawer-content">
            <div className="story-summary">
              <div><span>Articles</span><strong>{Number(cluster.articleCount || 0)}</strong></div>
              <div><span>Sources</span><strong>{cluster.sources.length}</strong></div>
              <div><span>Active since</span><strong>{fmt(cluster.startTime)}</strong></div>
            </div>

            <div className="active-window">
              <span className="summary-label">Active window</span>
              <div><span>{fmt(cluster.startTime)}</span><b>→</b><span>{fmt(cluster.endTime)}</span></div>
            </div>

            <div className="drawer-section-heading">
              <h3>Coverage</h3><span>{cluster.articles.length} article{cluster.articles.length === 1 ? '' : 's'}</span>
            </div>

            <div className="article-list">
              {cluster.articles.map((article) => (
                <article className="article-card" key={article.id}>
                  <div className="article-card-topline">
                    <span className={`source-badge ${tone[article.sourceName] || 'source-default'}`}>{article.sourceName}</span>
                    <time dateTime={article.publishedAt}>{fmt(article.publishedAt)}</time>
                  </div>
                  <h4>{article.title}</h4>
                  <a href={article.url} target="_blank" rel="noopener noreferrer">Read original article <span aria-hidden="true">↗</span></a>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
