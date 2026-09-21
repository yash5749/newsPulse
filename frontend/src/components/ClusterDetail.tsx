'use client';

import { format } from 'date-fns';
import type { ClusterDetail, Article } from '@/types/api';

interface ClusterDetailProps {
  cluster: ClusterDetail | null;
  onClose: () => void;
}

export function ClusterDetail({ cluster, onClose }: ClusterDetailProps) {
  if (!cluster) return null;

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const articlesBySource = cluster.articles.reduce((acc, article) => {
    if (!acc[article.source]) acc[article.source] = [];
    acc[article.source].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cluster-detail-title"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 id="cluster-detail-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {cluster.label}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close cluster detail"
          >
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">Articles</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{cluster.articleCount}</p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">Time Range</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatDate(cluster.startTime)} - {formatDate(cluster.endTime)}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">Sources</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{cluster.sources.join(', ')}</p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">Intensity</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {(cluster as any).intensity
                  ? Math.round((cluster as any).intensity * 100) + '%'
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Articles ({cluster.articles.length})
            </h3>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {cluster.articles.map((article) => (
                <article
                  key={article.id}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex-1 pr-2">
                      {article.title}
                    </h4>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Open
                    </a>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{article.source}</span>
                    <span>{formatDateTime(article.publishedAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}