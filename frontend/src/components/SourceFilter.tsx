'use client';

import type { CSSProperties } from 'react';
import type { Source } from '@/types/api';

interface SourceFilterProps {
  sources: Source[];
  selectedSources: string[];
  onToggleSource: (sourceName: string) => void;
}

const meta: Record<string, { cls: string; color: string }> = {
  BBC: { cls: 'bbc', color: '#d51d2f' },
  NPR: { cls: 'npr', color: '#2f72d9' },
  'The Guardian': { cls: 'guardian', color: '#c97800' },
};

export function SourceFilter({ sources, selectedSources, onToggleSource }: SourceFilterProps) {
  return (
    <section className="filter-card" aria-labelledby="coverage-title">
      <div>
        <div className="eyebrow eyebrow-dark">Coverage sources</div>
        <h2 id="coverage-title">Choose which outlets contribute to the timeline.</h2>
      </div>
      <div className="filter-controls">
        <span className="selected-count">{selectedSources.length} of {sources.length} selected</span>
        <div className="source-chips" role="group" aria-label="Source filters">
          {sources.map((source) => {
            const selected = selectedSources.includes(source.name);
            const sourceMeta = meta[source.name] ?? { cls: 'default', color: '#777' };
            return (
              <button
                type="button"
                key={source.id}
                className={`source-chip source-chip-${sourceMeta.cls} ${selected ? 'is-selected' : ''}`}
                onClick={() => onToggleSource(source.name)}
                aria-pressed={selected}
              >
                <span className="source-chip-mark" style={{ '--chip-color': sourceMeta.color } as CSSProperties}>
                  {selected ? '✓' : ''}
                </span>
                {source.name}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
