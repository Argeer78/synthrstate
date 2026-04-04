import Link from "next/link";

export default function ListingNotFound() {
  return (
    <div className="shell">
      <div className="state-block">
        <p className="state-block__title">Listing not found</p>
        <p style={{ margin: "0 0 16px" }}>This property is not available or the link is wrong.</p>
        <Link href="/listings">← Back to demo listings</Link>
      </div>
    </div>
  );
}
