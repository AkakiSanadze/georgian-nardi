export type Player = 'WHITE' | 'BLACK';

export interface PointState {
  owner: Player | null;
  count: number;
}

export type DaviLevel = 0 | 1 | 2 | 3 | 4 | 5; // 0: 1pt, 1: 2pt(დავი), 2: 3pt(სე), 3: 4pt(ჩარი), 4: 5pt(ბეში), 5: 6pt(შაში)

export interface DaviState {
  level: DaviLevel;
  value: number; // 1, 2, 3, 4, 5, 6
  owner: Player | null; // who has the right to redouble next (null means either can start Davi)
  offeredBy: Player | null; // who currently proposed the Davi
  offeredValue: number;
}

export interface SingleMove {
  from: number | 'BAR'; // 0..23 or 'BAR'
  to: number | 'OFF';   // 0..23 or 'OFF'
  dieUsed: number;      // 1..6
  isHit: boolean;
  isHomeBoardHit: boolean; // whether this hit happened in the moving player's home board
}

export interface MoveSequence {
  moves: SingleMove[];
  diceUsed: number[];
}

export interface BoardState {
  points: PointState[]; // exactly 24 elements (0..23)
  bar: {
    WHITE: number;
    BLACK: number;
  };
  borneOff: {
    WHITE: number;
    BLACK: number;
  };
  // The home board points where a hit was executed during the current turn.
  // Checkers at these points cannot be moved again, borne off, or covered by another checker during this turn!
  lockedHomeHitPoints: number[];
}

export type GameMode = 'CAMPAIGN' | 'QUICK' | 'PASS_AND_PLAY';
export type AIDifficulty = 'BEGINNER' | 'AMATEUR' | 'SKILLED' | 'GRANDMASTER';

export type GamePhase =
  | 'INITIAL_ROLL_FOR_FIRST'
  | 'WAITING_FOR_ROLL_OR_DAVI'
  | 'DAVI_OFFERED'
  | 'MOVING'
  | 'AI_THINKING'
  | 'ROUND_OVER'
  | 'MATCH_OVER';

export interface CampaignRound {
  id: number;
  city: string;
  location: string;
  opponentName: string;
  opponentTitle: string;
  opponentAvatar: string;
  difficulty: AIDifficulty;
  targetScore: number;
  description: string;
  personality: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE' | 'MASTER';
}

export interface MatchScore {
  WHITE: number;
  BLACK: number;
  targetScore: number;
  roundNumber: number;
  isCrawford: boolean;
  crawfordPassed: boolean;
}

export interface RoundResult {
  winner: Player;
  pointsWon: number;
  isMars: boolean;
  isKoksi?: boolean;
  isDavi: boolean;
  daviLevel: DaviLevel;
  reason: 'BEAR_OFF' | 'DAVI_DROP';
}

export type BoardThemeId =
  | 'CLASSIC_WALNUT'
  | 'ROYAL_EMERALD'
  | 'EBONY_GOLD'
  | 'COLCHIAN_WINE'
  | 'CAUCASUS_MARBLE';

export interface GameSettings {
  soundEnabled: boolean;
  soundVolume: number;
  hapticFeedbackEnabled?: boolean;
  singleTapMoveEnabled?: boolean;
  animationSpeed: 'FAST' | 'NORMAL' | 'SLOW';
  countMarsOnDavi: boolean; // Sports rule: true, Courtyard rule: false
  allowHitAndCoverInHome: boolean; // true: hitting and covering/hiding is allowed (default)
  showPointNumbers: boolean;
  showLegalTargets: boolean;
  autoBearOff: boolean;
  autoConfirmTurn?: boolean;
  boardTheme?: BoardThemeId;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  marsWon: number;
  marsLost: number;
  daviWon: number;
  daviAccepted: number;
  diceRollsCount: Record<string, number>; // e.g. "6-6": 12, "6-5": 24
}
