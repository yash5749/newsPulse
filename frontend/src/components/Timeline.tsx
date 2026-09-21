'use client';

import { useMemo, useState } from 'react';
import type { TimelineItem } from '@/types/api';

interface TimelineProps {
  data: TimelineItem[];
  onClusterClick: (clusterId: string) => void;
  selectedClusterId: string | null;
}

export function Timeline({ data, onClusterClick, selectedClusterId }: TimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 dark:text-zinc-400">
        <p>No clusters to display. Try adjusting your source filters.</p>
      </div>
    );
  }

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [data]);

  const timeExtent = useMemo(() => {
    const times = data.flatMap((d) => [new Date(d.startTime).getTime(), new Date(d.endTime).getTime()]);
    return {
      min: Math.min(...times),
      max: Math.max(...times),
    };
  }, [data]);

  const timeRange = timeExtent.max - timeExtent.min || 1;

  const getPosition = (time: string) => {
    const t = new Date(time).getTime();
    return ((t - timeExtent.min) / timeRange) * 100;
  };

  const getWidth = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return ((endTime - startTime) / timeRange) * 100 || 2;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const minDate = new Date(timeExtent.min);
  const maxDate = new Date(timeExtent.max);
  const dayCount = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const tickCount = Math.min(dayCount + 1, 7);
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const pos = i / (tickCount - 1);
    const date = new Date(timeExtent.min + pos * timeRange);
    return { pos: pos * 100, label: formatDate(date.toISOString()) };
  });

  return (
    <div className="w-full" role="region" aria-label="News timeline">
      <div className="relative h-8" aria-hidden="true">
        {ticks.map((tick, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700"
            style={{ left: `${tick.pos}%` }}
          >
            <span className="absolute -top-6 left-0 transform -translate-x-1/2 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              {tick.label}
            </span>
          </div>
        ))}
      </div>

      <div className="relative overflow-x-auto" style={{ minHeight: `${Math.max(data.length * 44, 200)}px` }}>
        {sortedData.map((item, index) => {
          const left = getPosition(item.startTime);
          const width = Math.max(getWidth(item.startTime, item.endTime), 1.5);
          const isSelected = selectedClusterId === item.clusterId;
          const isHovered = hoveredId === item.clusterId;

          const intensityColor = item.intensity > 0.7
            ? 'bg-red-500'
            : item.intensity > 0.4
            ? 'bg-amber-500'
            : 'bg-blue-500';

          return (
            <div
              key={item.clusterId}
              className="group relative cursor-pointer transition-all duration-150"
              style={{ top: `${index * 44}px`, height: '40px' }}
              onClick={() => onClusterClick(item.clusterId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClusterClick(item.clusterId);
                }
              }}
              onMouseEnter={() => setHoveredId(item.clusterId)}
              onMouseLeave={() => setHoveredId(null)}
              tabIndex={0}
              role="button"
              aria-label={`Cluster: ${item.label}, ${item.articleCount} articles, ${formatDate(item.startTime)} to ${formatDate(item.endTime)}`}
              aria-pressed={isSelected}
            >
              <div
                className={`absolute rounded ${intensityColor} transition-all duration-150 ${
                  isSelected ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-blue-500' : ''
                } ${isHovered && !isSelected ? 'scale-y-125 shadow-lg' : ''}`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  height: '100%',
                  opacity: isSelected || isHovered ? 1 : 0.85,
                }}
              >
                {width > 60 && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white truncate max-w-[calc(100%-8px)]">
                    {item.label}
                  </span>
                )}
              </div>

              {(isHovered || isSelected) && width <= 60 && (
                <div className="absolute z-10 top-full left-0 mt-1 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded shadow-lg whitespace-nowrap">
                  {item.label}
                </div>
              )}

              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-32 pr-2 text-right text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {item.sources.join(', ')}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Legend">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Intensity:</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}