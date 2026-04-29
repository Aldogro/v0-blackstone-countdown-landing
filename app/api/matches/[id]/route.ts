import { NextResponse } from "next/server";
import { redis } from '@/lib/redis';
import { MatchesData } from "@/lib/types";
import { KEY } from "../route";

async function readMatches(): Promise<MatchesData> {
  try {
    const data = await redis.get(KEY) as MatchesData;
    return data;
  } catch {
    return { matches: [] };
  }
}

async function writeMatches(data: MatchesData): Promise<void> {
  await redis.set(KEY, data);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await readMatches();
  const match = data.matches.find((m) => m.id === id);

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json(match);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updates = await request.json();

  const data = await readMatches();
  const matchIndex = data.matches.findIndex((m) => m.id === id);

  if (matchIndex === -1) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // Handle removing optional fields when they are explicitly set to undefined
  const currentMatch = data.matches[matchIndex];
  const updatedMatch = { ...currentMatch, ...updates };
  
  // If winner is explicitly undefined, remove it
  if (updates.winner === undefined && 'winner' in updates) {
    delete updatedMatch.winner;
  }
  // If finishedAt is explicitly undefined, remove it
  if (updates.finishedAt === undefined && 'finishedAt' in updates) {
    delete updatedMatch.finishedAt;
  }
  
  data.matches[matchIndex] = updatedMatch;
  await writeMatches(data);

  return NextResponse.json(data.matches[matchIndex]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await readMatches();
  const matchIndex = data.matches.findIndex((m) => m.id === id);

  if (matchIndex === -1) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  data.matches.splice(matchIndex, 1);
  await writeMatches(data);

  return NextResponse.json({ success: true });
}
