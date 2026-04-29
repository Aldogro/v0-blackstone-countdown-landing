export interface Player {
  name: string;
}

export interface Team {
  player1: Player;
  player2: Player;
}

export interface SetScore {
  team1Games: number;
  team2Games: number;
  tiebreak?: {
    team1Points: number;
    team2Points: number;
  };
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  sets: SetScore[];
  currentSet: number;
  currentGame: {
    team1Points: number; // 0, 15, 30, 40
    team2Points: number;
  };
  winner?: 1 | 2;
  status: "in-progress" | "finished";
  createdAt: string;
  finishedAt?: string;
}

export interface MatchesData {
  matches: Match[];
}
