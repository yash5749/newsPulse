interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
  onRefresh?: () => void;
}

export function EmptyState({ hasFilters, onClearFilters, onRefresh }: EmptyStateProps) {
  return (
    <div className="state-card">
      <div className="state-icon">⌁</div>
      <div>
        <h3>{hasFilters ? 'No stories match these sources' : 'No story clusters yet'}</h3>
        <p>{hasFilters ? 'Enable another source to bring more stories into the timeline.' : 'Refresh the news sources to fetch articles and build the timeline.'}</p>
        {hasFilters && onClearFilters ? (
          <button type="button" onClick={onClearFilters}>Show all sources</button>
        ) : onRefresh ? (
          <button type="button" onClick={onRefresh}>Refresh data</button>
        ) : null}
      </div>
    </div>
  );
}
