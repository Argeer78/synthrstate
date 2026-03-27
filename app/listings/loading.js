export default function ListingsIndexLoading() {
  return (
    <div className="shell listings-page">
      <header className="listings-page__header">
        <div className="skeleton-card" style={{ width: 100, height: 18, marginBottom: 16 }} />
        <div className="skeleton-card" style={{ height: 36, maxWidth: 280, marginBottom: 12 }} />
        <div className="skeleton-card" style={{ height: 48, maxWidth: 520 }} />
      </header>
      <div className="loading-block" aria-busy="true">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </div>
    </div>
  );
}
