export const runtime = "nodejs";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#6366f1"/>
    </linearGradient>
  </defs>
  <rect x="6" y="6" width="52" height="52" rx="14" fill="#fafafa"/>
  <path d="M18 42V22h20c6 0 10 4 10 10s-4 10-10 10H18Z" fill="url(#g)"/>
  <path d="M24 34h9" stroke="#fafafa" stroke-width="3" stroke-linecap="round"/>
  <path d="M24 28h14" stroke="#fafafa" stroke-width="3" stroke-linecap="round"/>
</svg>`;

export async function GET() {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
