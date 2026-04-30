"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Match, SetScore } from "@/lib/types";
import { Button } from "@/components/ui/button";
import TennisBall from "@/components/ui/tennis-ball";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Minus, ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

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
  const [isEditingFinished, setIsEditingFinished] = useState(false);

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

  // Calculate who is serving
  // In regular games: service alternates every game
  // In tiebreak: Team1 serves 1 point, then Team2 serves 2, Team1 serves 2, etc.
  function getServingTeamAndPlayer(): { team: 1 | 2; playerIndex: 0 | 1 } | null {
    if (!match || match.status === "finished") return null;

    const currentSet = match.sets[match.currentSet];
    const totalGamesInMatch = match.sets.reduce(
      (acc, set) => acc + set.team1Games + set.team2Games,
      0
    );
    const totalGamesInCurrentSet = currentSet.team1Games + currentSet.team2Games;

    const isTiebreak =
      currentSet.team1Games === 6 && currentSet.team2Games === 6;

    if (isTiebreak && currentSet.tiebreak) {
      // Tiebreak serving logic:
      // Point 0: Team A serves (1 serve)
      // Points 1-2: Team B serves (2 serves)
      // Points 3-4: Team A serves (2 serves)
      // Points 5-6: Team B serves (2 serves)
      // etc.
      const tiebreakPoints =
        currentSet.tiebreak.team1Points + currentSet.tiebreak.team2Points;

      // Determine initial server based on game rotation
      const initialServerTeam: 1 | 2 = totalGamesInMatch % 2 === 0 ? 1 : 2;
      const otherTeam: 1 | 2 = initialServerTeam === 1 ? 2 : 1;

      let servingTeam: 1 | 2;
      let serveBlockForPlayer: number;
      
      if (tiebreakPoints === 0) {
        // First point - initial server
        servingTeam = initialServerTeam;
        serveBlockForPlayer = 0;
      } else {
        // After first point, service changes in blocks of 2
        // Points 1-2: other team, Points 3-4: initial team, Points 5-6: other team, etc.
        const adjustedPoints = tiebreakPoints - 1; // Offset by 1 for the first serve
        const serveBlock = Math.floor(adjustedPoints / 2);
        servingTeam = serveBlock % 2 === 0 ? otherTeam : initialServerTeam;
        
        // Calculate serve block for player rotation within team
        // Initial team serves at blocks: 0 (point 0), 2 (points 3-4), 4 (points 7-8), etc.
        // Other team serves at blocks: 1 (points 1-2), 3 (points 5-6), etc.
        if (servingTeam === initialServerTeam) {
          serveBlockForPlayer = tiebreakPoints === 0 ? 0 : Math.floor((serveBlock + 1) / 2);
        } else {
          serveBlockForPlayer = Math.floor(serveBlock / 2);
        }
      }

      // Alternate players within the team based on how many serve blocks they've had
      const playerIndex: 0 | 1 = (serveBlockForPlayer % 2) as 0 | 1;

      return { team: servingTeam, playerIndex };
    } else {
      // Regular game serving logic
      // Alternate service every game, alternate players every 2 games within a team
      const servingTeam: 1 | 2 = totalGamesInCurrentSet % 2 === 0 ? 1 : 2;

      // Calculate which player is serving based on how many times this team has served
      const team1GamesServed = Math.ceil(totalGamesInCurrentSet / 2);
      const team2GamesServed = Math.floor(totalGamesInCurrentSet / 2);

      const teamGamesServed = servingTeam === 1 ? team1GamesServed : team2GamesServed;
      const playerIndex: 0 | 1 = (teamGamesServed % 2) as 0 | 1;

      return { team: servingTeam, playerIndex };
    }
  }

  function checkMatchWinner(sets: SetScore[]): 1 | 2 | null {
    if (!match) return null;

    const setsToWin = Math.ceil(match.totalSets / 2);
    let team1Sets = 0;
    let team2Sets = 0;

    for (const set of sets) {
      if (
        set.team1Games >= GAMES_TO_WIN_SET &&
        set.team1Games - set.team2Games >= 2
      ) {
        team1Sets++;
      } else if (
        set.team2Games >= GAMES_TO_WIN_SET &&
        set.team2Games - set.team1Games >= 2
      ) {
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

  // Check if a team has already won the current set (not tiebreak scenario)
  function isSetAlreadyWon(set: SetScore): boolean {
    // Set won with 2+ game difference
    if (set.team1Games >= GAMES_TO_WIN_SET && set.team1Games - set.team2Games >= 2) return true;
    if (set.team2Games >= GAMES_TO_WIN_SET && set.team2Games - set.team1Games >= 2) return true;
    // Tiebreak won
    if (set.team1Games === 7 || set.team2Games === 7) return true;
    return false;
  }

  function addPoint(team: 1 | 2) {
    if (!match) return;
    
    // Allow editing finished matches, but prevent adding points after modal is shown
    if (showFinishDialog) return;

    const currentSet = match.sets[match.currentSet];
    
    // Prevent adding points if set is already won (edge case protection)
    if (isSetAlreadyWon(currentSet)) return;
    
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
    if (!match) return;
    
    // Allow editing finished matches, but prevent subtracting if modal is shown
    if (showFinishDialog) return;

    const currentSet = match.sets[match.currentSet];
    const isTiebreak = currentSet.tiebreak !== undefined;

    let newMatch = { ...match };
    let newSets = [...match.sets];

    if (isTiebreak && currentSet.tiebreak) {
      const tiebreak = { ...currentSet.tiebreak };
      if (team === 1 && tiebreak.team1Points > 0) {
        tiebreak.team1Points--;
      } else if (team === 2 && tiebreak.team2Points > 0) {
        tiebreak.team2Points--;
      }
      newSets[match.currentSet] = { ...currentSet, tiebreak };
      newMatch.sets = newSets;
    } else {
      const points = newMatch.currentGame;
      
      // Check if we need to go back to previous game
      if (team === 1 && points.team1Points === 0) {
        // Go back to previous game if there was one
        if (currentSet.team1Games > 0 || currentSet.team2Games > 0) {
          // Someone has games, we can go back
          // Determine who won the last game (reverse the last game)
          const totalGamesInSet = currentSet.team1Games + currentSet.team2Games;
          if (totalGamesInSet > 0) {
            // The team that served last game was the opposite of current server
            // We assume team 1 wants to undo, so team 1 lost the last point that won the game
            // Go back to 40 for team 1, and we need to reduce team 1's games
            if (currentSet.team1Games > 0) {
              newSets[match.currentSet] = {
                ...currentSet,
                team1Games: currentSet.team1Games - 1,
              };
              newMatch.sets = newSets;
              newMatch.currentGame = { team1Points: 3, team2Points: 0 };
            }
          }
        }
      } else if (team === 2 && points.team2Points === 0) {
        if (currentSet.team1Games > 0 || currentSet.team2Games > 0) {
          const totalGamesInSet = currentSet.team1Games + currentSet.team2Games;
          if (totalGamesInSet > 0) {
            if (currentSet.team2Games > 0) {
              newSets[match.currentSet] = {
                ...currentSet,
                team2Games: currentSet.team2Games - 1,
              };
              newMatch.sets = newSets;
              newMatch.currentGame = { team1Points: 0, team2Points: 3 };
            }
          }
        }
      } else {
        // Normal subtraction within current game
        if (team === 1 && points.team1Points > 0) {
          newMatch.currentGame.team1Points--;
        } else if (team === 2 && points.team2Points > 0) {
          newMatch.currentGame.team2Points--;
        }
      }
    }

    updateMatch(newMatch);
  }

  async function handleSaveResult(match: Match) {
    if (!match || !pendingWinner) return;

    await updateMatch({
      ...match,
      winner: pendingWinner,
      status: "finished",
      finishedAt: new Date().toISOString(),
    });

    setShowFinishDialog(false);
    setIsEditingFinished(false);
    router.push("/partidos");
  }

  function handleDiscardResult() {
    // If editing a finished match, go back to list
    if (isEditingFinished) {
      router.push("/partidos");
      return;
    }
    setShowFinishDialog(false);
    setPendingWinner(null);
  }
  
  async function reopenMatch() {
    if (!match || match.status !== "finished") return;
    
    setIsEditingFinished(true);
    
    // Reopen the match for editing
    await updateMatch({
      status: "in-progress",
      winner: undefined,
      finishedAt: undefined,
    });
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

  const servingInfo = getServingTeamAndPlayer();

  return (
    <main className="min-h-[90vh] bg-background flex flex-col md:min-h-screen md:h-[90vh]">
      {/* Header */}
      <div className="absolute left-2 top-2 z-10 md:left-4 md:top-4">
        <Link href="/partidos">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </Link>
      </div>
      
      {/* Edit button for finished matches */}
      {match.status === "finished" && !isEditingFinished && (
        <div className="absolute right-2 top-2 z-10 md:right-4 md:top-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={reopenMatch}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
        </div>
      )}

      {/* Sets display */}
      <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 md:top-4">
        <div className="flex items-center gap-1 md:gap-2 rounded-lg bg-card/80 px-2 py-1 md:px-4 md:py-2 backdrop-blur">
          {match.sets.map((set, index) => (
            <div
              key={index}
              className={`px-2 py-0.5 text-xs md:text-sm font-mono ${
                index === match.currentSet
                  ? "bg-primary text-primary-foreground rounded"
                  : ""
              }`}
            >
              {set.team1Games}-{set.team2Games}
              {set.tiebreak && (
                <span className="text-[10px] md:text-xs">
                  ({Math.min(set.tiebreak.team1Points, set.tiebreak.team2Points)})
                </span>
              )}
            </div>
          ))}
          {isTiebreak && (
            <span className="ml-1 md:ml-2 text-[10px] md:text-xs text-muted-foreground">
              TIEBREAK
            </span>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Team 1 */}
        <div className="flex flex-1 flex-col items-center justify-between bg-secondary/30 p-4 pt-14 md:p-8 md:pt-8">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <p className="text-base md:text-2xl font-medium">
                {match.team1.player1.name}
              </p>
              {servingInfo?.team === 1 && servingInfo.playerIndex === 0 && (
                <TennisBall className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
              )}
            </div>
            <div className="flex items-center justify-center gap-2">
              <p className="text-base md:text-2xl font-medium">
                {match.team1.player2.name}
              </p>
              {servingInfo?.team === 1 && servingInfo.playerIndex === 1 && (
                <TennisBall className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 md:gap-4">
            <p className="text-xl md:text-4xl font-light text-muted-foreground">
              {currentSet.team1Games}
            </p>
            <p className="text-6xl md:text-[12rem] font-bold leading-none">
              {isTiebreak ? team1Points : pointsToDisplay(team1Points)}
            </p>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => subtractPoint(1)}
              disabled={showFinishDialog}
              className="h-12 w-12 md:h-16 md:w-16 rounded-full"
            >
              <Minus className="h-5 w-5 md:h-8 md:w-8" />
            </Button>
            <Button
              size="lg"
              onClick={() => addPoint(1)}
              disabled={showFinishDialog}
              className="h-14 w-14 md:h-20 md:w-20 rounded-full"
            >
              <Plus className="h-6 w-6 md:h-10 md:w-10" />
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border md:h-auto md:w-px" />

        {/* Team 2 */}
        <div className="flex flex-1 flex-col items-center justify-between bg-secondary/10 p-4 pb-8 md:p-8">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <p className="text-base md:text-2xl font-medium">
                {match.team2.player1.name}
              </p>
              {servingInfo?.team === 2 && servingInfo.playerIndex === 0 && (
                <TennisBall className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
              )}
            </div>
            <div className="flex items-center justify-center gap-2">
              <p className="text-base md:text-2xl font-medium">
                {match.team2.player2.name}
              </p>
              {servingInfo?.team === 2 && servingInfo.playerIndex === 1 && (
                <TennisBall className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 md:gap-4">
            <p className="text-xl md:text-4xl font-light text-muted-foreground">
              {currentSet.team2Games}
            </p>
            <p className="text-6xl md:text-[12rem] font-bold leading-none">
              {isTiebreak ? team2Points : pointsToDisplay(team2Points)}
            </p>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => subtractPoint(2)}
              disabled={showFinishDialog}
              className="h-12 w-12 md:h-16 md:w-16 rounded-full"
            >
              <Minus className="h-5 w-5 md:h-8 md:w-8" />
            </Button>
            <Button
              size="lg"
              onClick={() => addPoint(2)}
              disabled={showFinishDialog}
              className="h-14 w-14 md:h-20 md:w-20 rounded-full"
            >
              <Plus className="h-6 w-6 md:h-10 md:w-10" />
            </Button>
          </div>
        </div>
      </div>

      {/* Finish Dialog - Not dismissable */}
      <Dialog open={showFinishDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
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
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleDiscardResult}
              className="w-full sm:w-auto"
            >
              Descartar
            </Button>
            <Button onClick={() => handleSaveResult(match)} className="w-full sm:w-auto">
              Guardar Resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
