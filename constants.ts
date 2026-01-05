
export const DEFAULT_PERIOD_LENGTH = 720; // 12 minutes (NBA)
export const DEFAULT_SHOT_CLOCK = 24;
export const SHORT_SHOT_CLOCK = 14;
export const MAX_FOULS_LIMIT = 5;
export const TIMEOUTS_INITIAL = 7;

export const INITIAL_STATE = {
  home: {
    name: "HOME",
    score: 0,
    fouls: 0,
    timeouts: TIMEOUTS_INITIAL,
    color: "blue",
    bonus: false,
    doubleBonus: false,
  },
  away: {
    name: "AWAY",
    score: 0,
    fouls: 0,
    timeouts: TIMEOUTS_INITIAL,
    color: "red",
    bonus: false,
    doubleBonus: false,
  },
  period: 1,
  gameClock: DEFAULT_PERIOD_LENGTH,
  shotClock: DEFAULT_SHOT_CLOCK,
  isRunning: false,
  possession: null,
};
