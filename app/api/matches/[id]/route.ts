import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { MatchesData } from "@/lib/types";

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

  data.matches[matchIndex] = { ...data.matches[matchIndex], ...updates };
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
