"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Match } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Minus, ArrowLeft } from "lucide-react";
import Link from "next/link";

const POINTS = [0, 15, 30, 40];
const GAMES_TO_WIN_SET = 6;

function pointsToDisplay(points: number): string {
  if (points === 0) return "0";
  if (points === 1) return "15";
  if (points === 2) return "30";
  if (points === 3) return "40";
  return "AD";
}

export default function ScoreboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [pendingWinner, setPendingWinner] = useState<1 | 2 | null>(null);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMatch(data);
      }
    } catch (error) {
      console.error("Error fetching match:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  async function updateMatch(updates: Partial<Match>) {
    if (!match) return;

    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updated = await res.json();
        setMatch(updated);
      }
    } catch (error) {
      console.error("Error updating match:", error);
    }
  }

  function checkMatchWinner(sets: typeof match.sets): 1 | 2 | null {
    if (!match) return null;
    
    const setsToWin = Math.ceil(match.totalSets / 2);
    let team1Sets = 0;
    let team2Sets = 0;

    for (const set of sets) {
      if (set.team1Games >= GAMES_TO_WIN_SET && set.team1Games - set.team2Games >= 2) {
        team1Sets++;
      } else if (set.team2Games >= GAMES_TO_WIN_SET && set.team2Games - set.team1Games >= 2) {
        team2Sets++;
      } else if (set.team1Games === 7 || set.team2Games === 7) {
        if (set.team1Games > set.team2Games) team1Sets++;
        else team2Sets++;
      }
    }

    if (team1Sets >= setsToWin) return 1;
    if (team2Sets >= setsToWin) return 2;
    return null;
  }

  function addPoint(team: 1 | 2) {
    if (!match || match.status === "finished") return;

    const currentSet = match.sets[match.currentSet];
    const isTiebreak =
      currentSet.team1Games === 6 && currentSet.team2Games === 6;

    let newMatch = { ...match };
    let newSets = [...match.sets];
    let newCurrentGame = { ...match.currentGame };

    if (isTiebreak) {
      // Tiebreak logic
      if (!currentSet.tiebreak) {
        newSets[match.currentSet] = {
          ...currentSet,
          tiebreak: { team1Points: 0, team2Points: 0 },
        };
      }

      const tiebreak = newSets[match.currentSet].tiebreak!;
      if (team === 1) {
        tiebreak.team1Points++;
      } else {
        tiebreak.team2Points++;
      }

      // Check tiebreak winner (first to 7, win by 2)
      if (
        (tiebreak.team1Points >= 7 || tiebreak.team2Points >= 7) &&
        Math.abs(tiebreak.team1Points - tiebreak.team2Points) >= 2
      ) {
        if (tiebreak.team1Points > tiebreak.team2Points) {
          newSets[match.currentSet].team1Games = 7;
        } else {
          newSets[match.currentSet].team2Games = 7;
        }

        // Check match winner
        const winner = checkMatchWinner(newSets);
        if (winner) {
          setPendingWinner(winner);
          setShowFinishDialog(true);
          newMatch = {
            ...newMatch,
            sets: newSets,
          };
          setMatch(newMatch);
          return;
        }

        // Start new set
        newSets.push({ team1Games: 0, team2Games: 0 });
        newMatch.currentSet = newSets.length - 1;
        newCurrentGame = { team1Points: 0, team2Points: 0 };
      }

      newMatch.sets = newSets;
      newMatch.currentGame = newCurrentGame;
    } else {
      // Regular game logic
      const t1 = newCurrentGame.team1Points;
      const t2 = newCurrentGame.team2Points;

      if (team === 1) {
        if (t1 === 3 && t2 === 3) {
          // Deuce -> Advantage
          newCurrentGame.team1Points = 4;
        } else if (t1 === 4) {
          // Win game from advantage
          winGame(1);
          return;
        } else if (t2 === 4) {
          // Back to deuce
          newCurrentGame.team2Points = 3;
        } else if (t1 === 3 && t2 < 3) {
          // Win game
          winGame(1);
          return;
        } else {
          newCurrentGame.team1Points++;
        }
      } else {
        if (t2 === 3 && t1 === 3) {
          newCurrentGame.team2Points = 4;
        } else if (t2 === 4) {
          winGame(2);
          return;
        } else if (t1 === 4) {
          newCurrentGame.team1Points = 3;
        } else if (t2 === 3 && t1 < 3) {
          winGame(2);
          return;
        } else {
          newCurrentGame.team2Points++;
        }
      }

      newMatch.currentGame = newCurrentGame;
    }

    updateMatch(newMatch);
  }

  function winGame(team: 1 | 2) {
    if (!match) return;

    let newSets = [...match.sets];
    const currentSetIndex = match.currentSet;

    if (team === 1) {
      newSets[currentSetIndex].team1Games++;
    } else {
      newSets[currentSetIndex].team2Games++;
    }

    const currentSet = newSets[currentSetIndex];
    let newCurrentSet = currentSetIndex;
    let newCurrentGame = { team1Points: 0, team2Points: 0 };

    // Check if set is won
    const setWon =
      (currentSet.team1Games >= GAMES_TO_WIN_SET &&
        currentSet.team1Games - currentSet.team2Games >= 2) ||
      (currentSet.team2Games >= GAMES_TO_WIN_SET &&
        currentSet.team2Games - currentSet.team1Games >= 2);

    if (setWon) {
      // Check match winner
      const winner = checkMatchWinner(newSets);
      if (winner) {
        setPendingWinner(winner);
        setShowFinishDialog(true);
        setMatch({
          ...match,
          sets: newSets,
          currentGame: newCurrentGame,
        });
        return;
      }

      // Start new set
      newSets.push({ team1Games: 0, team2Games: 0 });
      newCurrentSet = newSets.length - 1;
    }

    updateMatch({
      ...match,
      sets: newSets,
      currentSet: newCurrentSet,
      currentGame: newCurrentGame,
    });
  }

  function subtractPoint(team: 1 | 2) {
    if (!match || match.status === "finished") return;

    const currentSet = match.sets[match.currentSet];
    const isTiebreak = currentSet.tiebreak !== undefined;

    let newMatch = { ...match };

    if (isTiebreak && currentSet.tiebreak) {
      const tiebreak = { ...currentSet.tiebreak };
      if (team === 1 && tiebreak.team1Points > 0) {
        tiebreak.team1Points--;
      } else if (team === 2 && tiebreak.team2Points > 0) {
        tiebreak.team2Points--;
      }
      newMatch.sets[match.currentSet].tiebreak = tiebreak;
    } else {
      if (team === 1 && newMatch.currentGame.team1Points > 0) {
        newMatch.currentGame.team1Points--;
      } else if (team === 2 && newMatch.currentGame.team2Points > 0) {
        newMatch.currentGame.team2Points--;
      }
    }

    updateMatch(newMatch);
  }

  async function handleSaveResult() {
    if (!match || !pendingWinner) return;

    await updateMatch({
      winner: pendingWinner,
      status: "finished",
      finishedAt: new Date().toISOString(),
    });

    setShowFinishDialog(false);
    router.push("/partidos");
  }

  function handleDiscardResult() {
    setShowFinishDialog(false);
    setPendingWinner(null);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando partido...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">Partido no encontrado</p>
        <Link href="/partidos">
          <Button variant="outline">Volver a Partidos</Button>
        </Link>
      </div>
    );
  }

  const currentSet = match.sets[match.currentSet];
  const isTiebreak =
    currentSet.team1Games === 6 && currentSet.team2Games === 6;

  const team1Points = isTiebreak
    ? currentSet.tiebreak?.team1Points ?? 0
    : match.currentGame.team1Points;
  const team2Points = isTiebreak
    ? currentSet.tiebreak?.team2Points ?? 0
    : match.currentGame.team2Points;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="absolute left-4 top-4 z-10">
        <Link href="/partidos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Sets display */}
      <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-lg bg-card/80 px-4 py-2 backdrop-blur">
          {match.sets.map((set, index) => (
            <div
              key={index}
              className={`px-3 py-1 text-sm font-mono ${
                index === match.currentSet
                  ? "bg-primary text-primary-foreground rounded"
                  : ""
              }`}
            >
              {set.team1Games}-{set.team2Games}
              {set.tiebreak && (
                <span className="text-xs">
                  ({Math.min(set.tiebreak.team1Points, set.tiebreak.team2Points)})
                </span>
              )}
            </div>
          ))}
          {isTiebreak && (
            <span className="ml-2 text-xs text-muted-foreground">TIEBREAK</span>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="flex min-h-screen">
        {/* Team 1 */}
        <div className="flex flex-1 flex-col items-center justify-between bg-secondary/30 p-4 md:p-8">
          <div className="text-center">
            <p className="text-lg font-medium md:text-2xl">
              {match.team1.player1.name}
            </p>
            <p className="text-lg font-medium md:text-2xl">
              {match.team1.player2.name}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-2xl font-light text-muted-foreground md:text-4xl">
              {currentSet.team1Games}
            </p>
            <p className="text-8xl font-bold md:text-[12rem]">
              {isTiebreak ? team1Points : pointsToDisplay(team1Points)}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => subtractPoint(1)}
              disabled={match.status === "finished"}
              className="h-16 w-16 rounded-full text-2xl"
            >
              <Minus className="h-8 w-8" />
            </Button>
            <Button
              size="lg"
              onClick={() => addPoint(1)}
              disabled={match.status === "finished"}
              className="h-20 w-20 rounded-full text-3xl"
            >
              <Plus className="h-10 w-10" />
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-border" />

        {/* Team 2 */}
        <div className="flex flex-1 flex-col items-center justify-between bg-secondary/10 p-4 md:p-8">
          <div className="text-center">
            <p className="text-lg font-medium md:text-2xl">
              {match.team2.player1.name}
            </p>
            <p className="text-lg font-medium md:text-2xl">
              {match.team2.player2.name}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-2xl font-light text-muted-foreground md:text-4xl">
              {currentSet.team2Games}
            </p>
            <p className="text-8xl font-bold md:text-[12rem]">
              {isTiebreak ? team2Points : pointsToDisplay(team2Points)}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => subtractPoint(2)}
              disabled={match.status === "finished"}
              className="h-16 w-16 rounded-full text-2xl"
            >
              <Minus className="h-8 w-8" />
            </Button>
            <Button
              size="lg"
              onClick={() => addPoint(2)}
              disabled={match.status === "finished"}
              className="h-20 w-20 rounded-full text-3xl"
            >
              <Plus className="h-10 w-10" />
            </Button>
          </div>
        </div>
      </div>

      {/* Finish Dialog */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partido Terminado</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-lg">
              Ganador:{" "}
              <span className="font-semibold">
                {pendingWinner === 1
                  ? `${match.team1.player1.name} / ${match.team1.player2.name}`
                  : `${match.team2.player1.name} / ${match.team2.player2.name}`}
              </span>
            </p>
            <p className="mt-2 font-mono text-muted-foreground">
              {match.sets
                .map((s) => {
                  let score = `${s.team1Games}-${s.team2Games}`;
                  if (s.tiebreak) {
                    score += `(${Math.min(
                      s.tiebreak.team1Points,
                      s.tiebreak.team2Points
                    )})`;
                  }
                  return score;
                })
                .join(" ")}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleDiscardResult}>
              Descartar
            </Button>
            <Button onClick={handleSaveResult}>Guardar Resultado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
