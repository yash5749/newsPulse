'use client';

import type { Source } from '@/types/api';

interface SourceFilterProps {
  sources: Source[];
  selectedSources: string[];
  onToggleSource: (sourceName: string) => void;
}

export function SourceFilter({ sources, selectedSources, onToggleSource }: SourceFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Source filters">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sources:</span>
      {sources.map((source) => {
        const isSelected = selectedSources.includes(source.name);
        return (
          <label
            key={source.id}
            className="inline-flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSource(source.name)}
              className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:focus:ring-offset-zinc-900"
              aria-label={source.name}
            />
            <span className={`text-sm font-medium transition-colors ${
              isSelected
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-zinc-700 dark:text-zinc-300'
            }`}>
              {source.name}
            </span>
          </label>
        );
      })}
    </div>
  );
}