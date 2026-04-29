"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Match, RegisteredPlayer } from "@/lib/types";
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
import { Plus, Pencil, ArrowLeft, X, Trophy, Trash, Users } from "lucide-react";
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

interface PlayerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  players: RegisteredPlayer[];
  onCreatePlayer: (name: string) => Promise<void>;
  placeholder?: string;
  selectedPlayers: string[];
}

function PlayerSelector({
  value,
  onChange,
  players,
  onCreatePlayer,
  placeholder = "Buscar jugador...",
  selectedPlayers,
}: PlayerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedPlayers.includes(p.name)
  );

  const exactMatch = players.find(
    (p) => p.name.toLowerCase() === search.toLowerCase()
  );

  const showCreateOption =
    search.trim() !== "" &&
    !exactMatch &&
    !selectedPlayers.includes(search.trim());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleCreatePlayer() {
    if (!search.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await onCreatePlayer(search.trim());
      onChange(search.trim());
      setSearch("");
      setIsOpen(false);
    } finally {
      setIsCreating(false);
    }
  }

  function handleSelectPlayer(name: string) {
    onChange(name);
    setSearch("");
    setIsOpen(false);
  }

  function handleClear() {
    onChange("");
    setSearch("");
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value || search}
          onChange={(e) => {
            if (value) {
              onChange("");
            }
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pr-8"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {isOpen && !value && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-auto">
          {filteredPlayers.length === 0 && !showCreateOption ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No se encontraron jugadores
            </div>
          ) : (
            <>
              {filteredPlayers.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handleSelectPlayer(player.name)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                >
                  {player.name}
                </button>
              ))}
              {showCreateOption && (
                <button
                  type="button"
                  onClick={handleCreatePlayer}
                  disabled={isCreating}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 border-t text-primary"
                >
                  <Plus className="h-4 w-4" />
                  {isCreating ? "Creando..." : `Crear "${search.trim()}"`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function PartidosPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    team1Player1: "",
    team1Player2: "",
    team2Player1: "",
    team2Player2: "",
    totalSets: 1 as 1 | 3 | 5,
  });

  useEffect(() => {
    fetchMatches();
    fetchPlayers();
  }, []);

  async function fetchMatches() {
    try {
      const res = await fetch('/api/matches');
      console.log('res', res)
      const data = await res.json() as Match[];
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteMatch(id: string) {
    if (confirm('¿Estás seguro de querer eliminar este partido?')) {
      try {
        const res = await fetch(`/api/matches/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchMatches();
        }
      } catch (error) {
        console.error('Error deleting match:', error);
      }
    }
  }

  async function fetchPlayers() {
    try {
      const res = await fetch('/api/players');
      console.log('res', res)
      const data = await res.json();
      setPlayers(data);
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  }

  async function createPlayer(name: string) {
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const newPlayer = await res.json();
        setPlayers((prev) => {
          if (prev.find((p) => p.id === newPlayer.id)) return prev;
          return [...prev, newPlayer];
        });
      }
    } catch (error) {
      console.error('Error creating player:', error);
    }
  }

  const selectedPlayers = [
    formData.team1Player1,
    formData.team1Player2,
    formData.team2Player1,
    formData.team2Player2,
  ].filter(Boolean);

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
      totalSets: formData.totalSets,
    };

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          totalSets: 1,
        });
        router.push(`/partidos/${match.id}`);
      }
    } catch (error) {
      console.error("Error creating match:", error);
    }
  }

  const isFormValid =
    formData.team1Player1 &&
    formData.team1Player2 &&
    formData.team2Player1 &&
    formData.team2Player2;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight">Partidos</h1>
          </div>
          <Link href="/jugadores">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Jugadores</span>
              <span className="sm:hidden">Jugadores</span>
            </Button>
          </Link>
          <Link href="/bpt">
            <Button variant="outline" className="gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Puntos BPT</span>
              <span className="sm:hidden">BPT</span>
            </Button>
          </Link>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg md:text-xl font-light">
              Lista de Partidos
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Iniciar Partido
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                        <PlayerSelector
                          value={formData.team1Player1}
                          onChange={(val) =>
                            setFormData({ ...formData, team1Player1: val })
                          }
                          players={players}
                          onCreatePlayer={createPlayer}
                          selectedPlayers={selectedPlayers}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="team1Player2">Jugador 2</Label>
                        <PlayerSelector
                          value={formData.team1Player2}
                          onChange={(val) =>
                            setFormData({ ...formData, team1Player2: val })
                          }
                          players={players}
                          onCreatePlayer={createPlayer}
                          selectedPlayers={selectedPlayers}
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
                        <PlayerSelector
                          value={formData.team2Player1}
                          onChange={(val) =>
                            setFormData({ ...formData, team2Player1: val })
                          }
                          players={players}
                          onCreatePlayer={createPlayer}
                          selectedPlayers={selectedPlayers}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="team2Player2">Jugador 2</Label>
                        <PlayerSelector
                          value={formData.team2Player2}
                          onChange={(val) =>
                            setFormData({ ...formData, team2Player2: val })
                          }
                          players={players}
                          onCreatePlayer={createPlayer}
                          selectedPlayers={selectedPlayers}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Sets a jugar</Label>
                    <div className="flex gap-2">
                      {[1, 3, 5].map((num) => (
                        <Button
                          key={num}
                          type="button"
                          variant={
                            formData.totalSets === num ? "default" : "outline"
                          }
                          className="flex-1"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              totalSets: num as 1 | 3 | 5,
                            })
                          }
                        >
                          {num} {num === 1 ? "Set" : "Sets"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!isFormValid}
                  >
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
              <div className="overflow-x-auto -mx-4 md:mx-0">
                {/* Mobile view */}
                <div className="block md:hidden space-y-3 px-4">
                  {matches.map((match) => (
                    <Link
                      key={match.id}
                      href={`/partidos/${match.id}`}
                      className="block"
                    >
                      <div className="rounded-lg border bg-card p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {match.team1.player1.name} /{" "}
                              {match.team1.player2.name}
                            </p>
                            <p className="text-muted-foreground text-sm">vs</p>
                            <p className="font-medium text-sm">
                              {match.team2.player1.name} /{" "}
                              {match.team2.player2.name}
                            </p>
                          </div>
                          <span className="font-mono text-sm">
                            {formatResult(match)}
                          </span>
                        </div>
                        {match.winner && (
                          <p className="text-xs text-primary">
                            Ganador: {getWinnerName(match)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop view */}
                <Table className="hidden md:table">
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
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMatch(match.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
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
