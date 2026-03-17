export interface Player {
  id: number; // 1–8
  name: string;
}

export interface MatchScore {
  team1: number;
  team2: number;
}

export interface Match {
  game: number;
  team1: [number, number];
  team2: [number, number];
  score: MatchScore | null;
}

export interface FinalMatch {
  game: number;
  team1: [number, number];
  team2: [number, number];
  score: MatchScore | null;
}

export interface PlayerStats {
  player: Player;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  saldo: number;
}

export interface TiebreakerMatch {
  players: [number, number];
  score: MatchScore | null;
}

export type GenerationMode = 'auto' | 'manual';
export type TournamentPhase = 'setup' | 'classification' | 'final' | 'finished';

export interface Tournament {
  id: string;
  name: string;
  createdAt: string;
  phase: TournamentPhase;
  players: Player[];
  generationMode: GenerationMode;
  matches: Match[];
  finalMatches: FinalMatch[];
  finalists: number[];
  tiebreaker: TiebreakerMatch | null;
}
