import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || "http://localhost:8123";

// Minimal semantic-only diagnostic endpoint: proxies to the Python FastAPI
// sidecar (search_service/service.py) since TurboVec is a Python package
// with no equivalent here. Covers the full corpus (195,578 decisions).
// The real search UI (/semantisch-zoeken) uses /api/hybrid-search instead,
// which fuses this signal with FTS5 keyword search, court-authority, and
// recency weighting -- this route stays a thin, single-signal passthrough,
// useful for isolating the semantic side when debugging.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json({ hits: [] });
  }
  const k = Math.min(Math.max(1, parseInt(params.get("k") || "10")), 50);

  try {
    const upstream = await fetch(`${SEARCH_SERVICE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, k }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `search service returned ${upstream.status}` },
        { status: 502 }
      );
    }
    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "semantic search service unreachable (is service.py running on :8123?)" },
      { status: 503 }
    );
  }
}
