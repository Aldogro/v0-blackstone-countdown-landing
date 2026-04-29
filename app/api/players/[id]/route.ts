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
