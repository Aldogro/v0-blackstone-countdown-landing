"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, ArrowLeft } from "lucide-react";
import Link from "next/link";

function formatResult(match: Match): string {
  if (match.sets.length === 0) return "-";
  return match.sets
    .map((set) => {
      let score = `${set.team1Games}-${set.team2Games}`;
      if (set.tiebreak) {
        const loserTiebreakPoints = Math.min(
          set.tiebreak.team1Points,
          set.tiebreak.team2Points
        );
        score += `(${loserTiebreakPoints})`;
      }
      return score;
    })
    .join(" ");
}

function getWinnerName(match: Match): string {
  if (!match.winner) return "-";
  const team = match.winner === 1 ? match.team1 : match.team2;
  return `${team.player1.name} / ${team.player2.name}`;
}

export default function PartidosPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    team1Player1: "",
    team1Player2: "",
    team2Player1: "",
    team2Player2: "",
  });

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

  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault();

    const newMatch = {
      team1: {
        player1: { name: formData.team1Player1 },
        player2: { name: formData.team1Player2 },
      },
      team2: {
        player1: { name: formData.team2Player1 },
        player2: { name: formData.team2Player2 },
      },
    };

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMatch),
      });

      if (res.ok) {
        const match = await res.json();
        setIsDialogOpen(false);
        setFormData({
          team1Player1: "",
          team1Player2: "",
          team2Player1: "",
          team2Player2: "",
        });
        router.push(`/partidos/${match.id}`);
      }
    } catch (error) {
      console.error("Error creating match:", error);
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-light tracking-tight">Partidos</h1>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-light">
              Lista de Partidos
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Iniciar Partido
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nuevo Partido</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateMatch} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Pareja 1
                    </h3>
                    <div className="grid gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="team1Player1">Jugador 1</Label>
                        <Input
                          id="team1Player1"
                          value={formData.team1Player1}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              team1Player1: e.target.value,
                            })
                          }
                          placeholder="Nombre"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="team1Player2">Jugador 2</Label>
                        <Input
                          id="team1Player2"
                          value={formData.team1Player2}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              team1Player2: e.target.value,
                            })
                          }
                          placeholder="Nombre"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Pareja 2
                    </h3>
                    <div className="grid gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="team2Player1">Jugador 1</Label>
                        <Input
                          id="team2Player1"
                          value={formData.team2Player1}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              team2Player1: e.target.value,
                            })
                          }
                          placeholder="Nombre"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="team2Player2">Jugador 2</Label>
                        <Input
                          id="team2Player2"
                          value={formData.team2Player2}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              team2Player2: e.target.value,
                            })
                          }
                          placeholder="Nombre"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Iniciar Partido
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Cargando partidos...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  No hay partidos registrados
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Inicia un nuevo partido para comenzar
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pareja 1</TableHead>
                      <TableHead>Pareja 2</TableHead>
                      <TableHead>Pareja Ganadora</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>
                          <div className="font-medium">
                            {match.team1.player1.name} /{" "}
                            {match.team1.player2.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {match.team2.player1.name} /{" "}
                            {match.team2.player2.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              match.winner
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {getWinnerName(match)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">
                            {formatResult(match)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/partidos/${match.id}`}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
