import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { Match, MatchesData } from "@/lib/types";

const DATA_FILE = path.join(process.cwd(), "data", "matches.json");

async function readMatches(): Promise<MatchesData> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { matches: [] };
  }
}

async function writeMatches(data: MatchesData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = await readMatches();
  return NextResponse.json(data.matches);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { team1, team2 } = body;

  const newMatch: Match = {
    id: crypto.randomUUID(),
    team1,
    team2,
    sets: [{ team1Games: 0, team2Games: 0 }],
    currentSet: 0,
    currentGame: { team1Points: 0, team2Points: 0 },
    status: "in-progress",
    createdAt: new Date().toISOString(),
  };

  const data = await readMatches();
  data.matches.push(newMatch);
  await writeMatches(data);

  return NextResponse.json(newMatch, { status: 201 });
}
