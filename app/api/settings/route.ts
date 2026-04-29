// app/api/settings/route.ts
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';


// Initialize Redis
const redis = Redis.fromEnv();

const KEY = 'settings';

export async function GET() {
  const data = await redis.get(KEY);
  return NextResponse.json(data ?? {});
}

export async function POST(req: Request) {
  const body = await req.json();

  await redis.set(KEY, body);

  return NextResponse.json({ ok: true });
}