export default function ListingLoading() {
  return (
    <div className="shell shell--detail">
      <div className="skeleton-card" style={{ maxWidth: 140, height: 20, marginBottom: 8 }} />
      <div className="skeleton-card" style={{ height: 40, maxWidth: 560, marginBottom: 12 }} />
      <div className="skeleton-card" style={{ height: 32, maxWidth: 220, marginBottom: 24 }} />
      <div className="detail-loading-grid">
        <div className="skeleton-card" style={{ aspectRatio: "16/10" }} />
        <div className="skeleton-card" style={{ height: 280 }} />
      </div>
      <div className="skeleton-card" style={{ height: 120, marginTop: 8 }} />
      <div className="skeleton-card" style={{ height: 200, marginTop: 16 }} />
    </div>
  );
}
