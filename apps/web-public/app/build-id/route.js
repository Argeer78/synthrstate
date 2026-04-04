export const runtime = "nodejs";

function pickCommit() {
  return (
    process.env.GIT_COMMIT_SHA ||
    process.env.COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.HEROKU_SLUG_COMMIT ||
    "unknown"
  );
}

export async function GET() {
  const payload = {
    app: "web-public",
    commit: pickCommit(),
    nodeEnv: process.env.NODE_ENV || "unknown",
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
