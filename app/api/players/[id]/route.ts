import { NextResponse } from "next/server";
import { redis } from '@/lib/redis';
import { PlayersData } from "@/lib/types";

import { KEY } from "../route";

async function readPlayers(): Promise<PlayersData> {
  try {
    const data = await redis.get(KEY) as PlayersData;
    return data;
  } catch {
    return { players: [] };
  }
}

async function writePlayers(data: PlayersData): Promise<void> {
  await redis.set(KEY, data);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await readPlayers();
  const player = data.players.find((p) => p.id === id);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json(player);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await readPlayers();
  const player = data.players.find((p) => p.id === id);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const updates = await request.json();
  const updatedPlayer = { ...player, ...updates };
  await writePlayers({ ...data, players: data.players.map((p) => p.id === id ? updatedPlayer : p) });
  return NextResponse.json(updatedPlayer);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await readPlayers();
  const matchIndex = data.players.findIndex((m) => m.id === id);

  if (matchIndex === -1) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  data.players.splice(matchIndex, 1);
  await writePlayers(data);

  return NextResponse.json({ success: true });
}
