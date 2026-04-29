"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RegisteredPlayer } from "@/lib/types";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft, Trophy, Trash } from "lucide-react";
import Link from "next/link";
import TennisBall from "@/components/ui/tennis-ball";

export default function JugadoresPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<RegisteredPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    playerName: '',
  });

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    try {
      const res = await fetch('/api/players');
      console.log('res', res)
      const data = await res.json();
      setPlayers(data);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeletePlayer(id: string) {
    if (confirm('¿Estás seguro de querer eliminar este jugador?')) {
      try {
        const res = await fetch(`/api/players/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchPlayers();
        }
      } catch (error) {
        console.error('Error deleting player:', error);
      }
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

  async function handleCreatePlayer(e: React.FormEvent) {
    e.preventDefault();
    await createPlayer(formData.playerName);
    setFormData({ playerName: '' });
    setIsDialogOpen(false);
  }

  const isFormValid = Boolean(formData.playerName);

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
            <h1 className="text-2xl md:text-3xl font-light tracking-tight">Jugadores</h1>
          </div>
          <Link href="/partidos">
            <Button variant="outline" className="gap-2">
              <TennisBall className="h-4 w-4" />
              <span className="hidden sm:inline">Partidos</span>
              <span className="sm:hidden">Partidos</span>
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
              Lista de Jugadores
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Agregar Jugador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nuevo Jugador</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePlayer} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Nombre
                    </h3>
                    <Input
                      id="playerName"
                      name="playerName"
                      value={formData.playerName}
                      onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                      placeholder="Nombre del jugador"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!isFormValid}
                  >
                    Agregar Jugador
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Cargando jugadores...</p>
              </div>
            ) : players.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  No hay jugadores registrados
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 md:mx-0">
                {/* Mobile view */}
                <div className="block md:hidden space-y-3 px-4">
                  {players.map((player) => (
                    <div key={player.id} className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                        <p className="font-medium text-sm">
                            {player.name}
                        </p>
                        </div>
                        <span className="font-mono text-sm">
                        </span>
                    </div>
                    </div>
                  ))}
                </div>

                {/* Desktop view */}
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <div className="font-medium">
                            {player.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePlayer(player.id)}>
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
