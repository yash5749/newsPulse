export function LoadingState() {
  return (
    <section className="timeline-panel" aria-busy="true" aria-label="Loading timeline">
      <div className="timeline-head">
        <div>
          <div className="skeleton skeleton-eyebrow" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-copy" />
        </div>
      </div>
      <div className="timeline-scroll loading-scroll">
        <div className="loading-axis" />
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="skeleton-row" key={index}>
            <div className="skeleton-meta"><span className="skeleton skeleton-line wide" /><span className="skeleton skeleton-line medium" /></div>
            <div className="skeleton-track"><span className="skeleton skeleton-bar" style={{ width: `${26 + (index % 5) * 11}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}
