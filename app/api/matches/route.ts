import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { Match, MatchesData } from "@/lib/types";

const KEY = 'matches';

async function readMatches(): Promise<MatchesData> {
  try {
    const data = await redis.get(KEY) as MatchesData;
    if (!data) {
      await redis.set(KEY, { matches: []})
      return { matches: [] };
    }
    return data;
  } catch {
    return { matches: [] };
  }
}

async function writeMatches(data: MatchesData): Promise<void> {
  await redis.set(KEY, data);
}

export async function GET() {
  const data = await readMatches();
  return NextResponse.json(data?.matches ?? []);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { team1, team2, totalSets = 3 } = body;

  const newMatch: Match = {
    id: crypto.randomUUID(),
    team1,
    team2,
    sets: [{ team1Games: 0, team2Games: 0 }],
    currentSet: 0,
    totalSets: totalSets as 1 | 3 | 5,
    currentGame: { team1Points: 0, team2Points: 0 },
    status: "in-progress",
    createdAt: new Date().toISOString(),
  };

  const data = await readMatches();
  data.matches.push(newMatch);
  await writeMatches(data);

  return NextResponse.json(newMatch, { status: 201 });
}
