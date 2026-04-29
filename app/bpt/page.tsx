"use client";

import { useState, useEffect } from "react";
import { Match } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";

interface PlayerStats {
  name: string;
  points: number;
  matchesWon: number;
  matchesPlayed: number;
}

export default function BPTPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    try {
      const res = await fetch("/api/matches");
      const data = await res.json();
      setMatches(data);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function calculateRankings(): PlayerStats[] {
    const playerMap = new Map<string, PlayerStats>();

    for (const match of matches) {
      if (match.status !== "finished" || !match.winner) continue;

      // Get all players from both teams
      const allPlayers = [
        match.team1.player1.name,
        match.team1.player2.name,
        match.team2.player1.name,
        match.team2.player2.name,
      ];

      // Get winning team players
      const winningTeam = match.winner === 1 ? match.team1 : match.team2;
      const winners = [winningTeam.player1.name, winningTeam.player2.name];

      // Update stats for all players
      for (const playerName of allPlayers) {
        const normalizedName = playerName.trim().toLowerCase();
        const displayName = playerName.trim();
        
        if (!playerMap.has(normalizedName)) {
          playerMap.set(normalizedName, {
            name: displayName,
            points: 0,
            matchesWon: 0,
            matchesPlayed: 0,
          });
        }

        const stats = playerMap.get(normalizedName)!;
        stats.matchesPlayed++;

        // Award point if player is in winning team
        if (winners.some(w => w.trim().toLowerCase() === normalizedName)) {
          stats.points++;
          stats.matchesWon++;
        }
      }
    }

    // Convert to array and sort by points (descending)
    return Array.from(playerMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.matchesWon - a.matchesWon;
    });
  }

  const rankings = calculateRankings();

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-light tracking-tight">
              Blackstone Padel Tournament
            </h1>
            <p className="text-sm text-muted-foreground">
              Ranking de jugadores
            </p>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-light">
              <Trophy className="h-5 w-5" />
              Clasificacion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Cargando ranking...</p>
              </div>
            ) : rankings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  No hay partidos finalizados
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Los puntos se asignan al finalizar partidos
                </p>
                <Link href="/partidos" className="mt-4">
                  <Button variant="outline">Ir a Partidos</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">Pos</TableHead>
                      <TableHead>Jugador</TableHead>
                      <TableHead className="text-center">Puntos</TableHead>
                      <TableHead className="text-center">Ganados</TableHead>
                      <TableHead className="text-center">Jugados</TableHead>
                      <TableHead className="text-center">Win Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.map((player, index) => (
                      <TableRow key={player.name}>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                              index === 0
                                ? "bg-yellow-500/20 text-yellow-500"
                                : index === 1
                                ? "bg-gray-400/20 text-gray-400"
                                : index === 2
                                ? "bg-amber-600/20 text-amber-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {player.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-lg font-semibold">
                            {player.points}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {player.matchesWon}
                        </TableCell>
                        <TableCell className="text-center">
                          {player.matchesPlayed}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-muted-foreground">
                            {player.matchesPlayed > 0
                              ? Math.round(
                                  (player.matchesWon / player.matchesPlayed) * 100
                                )
                              : 0}
                            %
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center gap-4">
          <Link href="/partidos">
            <Button variant="outline">Ver Partidos</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
