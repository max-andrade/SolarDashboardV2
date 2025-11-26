import { NextResponse } from "next/server";

const WINDOW_MS = 10_000;
const MAX_REQUESTS = 2;

type Counter = { count: number; expiresAt: number };
const buckets = new Map<string, Counter>();

function rateLimit(identifier: string) {
  const now = Date.now();
  const bucket = buckets.get(identifier);
  if (bucket && bucket.expiresAt > now) {
    if (bucket.count >= MAX_REQUESTS) {
      return false;
    }
    bucket.count += 1;
    return true;
  }
  buckets.set(identifier, { count: 1, expiresAt: now + WINDOW_MS });
  return true;
}

function parseIso(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const from = parseIso(fromParam);
  const to = parseIso(toParam);

  if (!from || !to) {
    return NextResponse.json({ error: "Invalid or missing from/to" }, { status: 400 });
  }
  if (from > to) {
    return NextResponse.json({ error: "from must be before to" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": "10" } });
  }

  const upstreamBase = process.env.POWER_DATA_API_URL;
  const apiKey = process.env.POWER_DATA_API_KEY;
  if (!upstreamBase) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const upstreamUrl = new URL(upstreamBase);
  upstreamUrl.searchParams.set("from", from.toISOString());
  upstreamUrl.searchParams.set("to", to.toISOString());

  const headers: Record<string, string> = {};
  if (apiKey) headers["X-API-Key"] = apiKey;

  const resp = await fetch(upstreamUrl.toString(), { headers, cache: "no-store" });
  if (!resp.ok) {
    return NextResponse.json(
      { error: "Upstream request failed", status: resp.status },
      { status: resp.status }
    );
  }

  const data = await resp.json();
  return NextResponse.json(data);
}
