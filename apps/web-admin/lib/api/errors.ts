export async function readApiError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  // Try JSON first (Nest commonly returns { message } or { message: [] })
  try {
    const j = text ? JSON.parse(text) : null;
    const msg = (j && (j.message ?? j.error ?? j.detail)) as unknown;
    if (Array.isArray(msg)) return msg.map(String).join("; ");
    if (typeof msg === "string" && msg.trim()) return msg;
  } catch {
    // ignore
  }

  if (text && text.trim()) return text.slice(0, 240);
  return `Request failed (${res.status})`;
}

