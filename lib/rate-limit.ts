import { NextRequest, NextResponse } from "next/server";

const buckets = new Map<string, { count: number; reset: number }>();

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  export: { max: 20, windowMs: 60_000 },
  cron: { max: 5, windowMs: 60_000 },
  backup: { max: 10, windowMs: 60_000 },
};

export function checkRateLimit(request: NextRequest, key: string): NextResponse | null {
  if (process.env.RATE_LIMIT_DISABLED === "true") return null;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const bucketKey = `${key}:${ip}`;
  const limit = LIMITS[key] ?? { max: 30, windowMs: 60_000 };
  const now = Date.now();
  const entry = buckets.get(bucketKey);

  if (!entry || now > entry.reset) {
    buckets.set(bucketKey, { count: 1, reset: now + limit.windowMs });
    return null;
  }

  if (entry.count >= limit.max) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  entry.count += 1;
  return null;
}
