
export interface TeamState {
  name: string;
  score: number;
  fouls: number;
  timeouts: number;
  color: string;
  bonus: boolean;
  doubleBonus: boolean;
}

export interface GameState {
  home: TeamState;
  away: TeamState;
  period: number;
  gameClock: number; // in seconds
  shotClock: number; // in seconds
  isRunning: boolean;
  possession: 'home' | 'away' | null;
}

export interface GameLog {
  timestamp: number;
  event: string;
  homeScore: number;
  awayScore: number;
}
