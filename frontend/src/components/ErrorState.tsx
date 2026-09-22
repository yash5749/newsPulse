interface ErrorStateProps { message: string; onRetry: () => void; }

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="state-card" role="alert">
      <div className="state-icon error">!</div>
      <div>
        <h3>Unable to load the timeline</h3>
        <p>We couldn't retrieve the latest story clusters.</p>
        <button type="button" onClick={onRetry}>Try again</button>
        <details><summary>Technical details</summary><code>{message}</code></details>
      </div>
    </div>
  );
}
