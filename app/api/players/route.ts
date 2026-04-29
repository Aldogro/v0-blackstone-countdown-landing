import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { PlayersData, RegisteredPlayer } from "@/lib/types";

const DATA_FILE = path.join(process.cwd(), "data", "players.json");

async function getPlayersData(): Promise<PlayersData> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { players: [] };
  }
}

async function savePlayersData(data: PlayersData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = await getPlayersData();
  return NextResponse.json(data.players);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const data = await getPlayersData();
  
  // Check if player already exists (case insensitive)
  const existingPlayer = data.players.find(
    (p) => p.name.toLowerCase() === name.trim().toLowerCase()
  );
  
  if (existingPlayer) {
    return NextResponse.json(existingPlayer);
  }

  const newPlayer: RegisteredPlayer = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  data.players.push(newPlayer);
  await savePlayersData(data);

  return NextResponse.json(newPlayer, { status: 201 });
}
