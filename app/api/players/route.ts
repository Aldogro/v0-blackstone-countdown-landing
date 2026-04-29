import { NextResponse } from 'next/server';
import { PlayersData, RegisteredPlayer } from '@/lib/types';
import { redis } from '@/lib/redis';

export const KEY = 'players';

async function getPlayersData(): Promise<PlayersData> {
  try {
    const data = await redis.get(KEY) as PlayersData;
    if (!data) {
      await redis.set(KEY, { players: []})
      return { players: [] };
    }
    return data;
  } catch {
    return { players: [] };
  }
}

async function savePlayersData(data: PlayersData): Promise<void> {
  await redis.set(KEY, data);
}

export async function GET() {
  const data = await getPlayersData();
  return NextResponse.json(data.players);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
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
