// Game State Types
export interface GameState {
  currentNumber?: number;
  currentColumn?: string;
  calledNumbers: number[];
  gameStatus: GameStatus;
  gameId?: string;
  eventId?: string;
  cartelas?: number;
  stack?: number;
  totalStack?: number; // Total amount bet on the game
  totalWinStack?: number;
  // Financial breakdown fields
  totalShopMargin?: number; // Total shop margin from all bets
  totalSystemFee?: number; // Total system fee from all bets
  netPrizePool?: number; // Net prize pool (totalStack - shopMargin - systemFee)
  netShopProfit?: number; // Net shop profit (shopMargin - systemFee)
  gameHistory?: GameHistoryItem[];
  top3Winners?: Top3WinnerItem[];
  isLoadingGameData?: boolean;
  selectedCartelas?: number[]; // Cartelas that are currently selected by players
}

export type GameStatus = 'waiting' | 'active' | 'paused' | 'finished' | 'completed' | 'cancelled';

export interface GameHistoryItem {
  gameId: string;
  date: string;
  duration: string;
  totalNumbers: number;
  winners: number;
}

export interface Top3WinnerItem {
  position: number;
  cartelaId: string;
  gameId: string;
  prize: string;
  date: string;
}

// Verification Types
export interface VerificationData {
  cartelaId: number;
  ticketNumber: string;
  gameId: string;
  status: 'won' | 'lost' | 'locked';
  cartelaGrid: number[][];
  matchedNumbers: number[];
  drawnNumbers: number[]; // Numbers that have been drawn in the current game
  winningPatternDetails?: Array<{
    patternName: string;
    pattern: boolean[][];
    matchedPositions: number[][];
  }>;
  gameProgress: number;
  totalCalledNumbers: number;
  isLocked?: boolean;
  originalStatus?: 'won' | 'lost'; // Original verification status before locking
}

// Socket Types
export interface SocketEvents {
  'game_start': (data: { gameId: string; eventId: string }) => void;
  'number_called': (data: { number: number }) => void;
  'game_end': (data: unknown) => void;
  'game:created': GameCreatedEvent;
  'game:started': GameStartedEvent;
  'game:paused': () => void;
  'game:resumed': () => void;
  'game:reset': GameResetEvent;
  'game:ended': () => void;
  'number:drawn': NumberDrawnEvent;
  'game:update': GameUpdateEvent;
  'cartela_verified': (data: VerificationData) => void;
  'close-verification-modal': () => void;
  'display:unauthorized': () => void;
}

export interface GameCreatedEvent {
  gameId: string;
  status: string;
  calledNumbers: number[];
  winStack: number;
  cartelas: number;
}

export interface GameStartedEvent {
  gameId: string;
}

export interface GameResetEvent {
  gameId?: string;
  status?: string;
  timestamp?: Date;
}

export interface NumberDrawnEvent {
  calledNumbers: number[];
  number: number;
}

export interface GameUpdateEvent {
  status?: string;
  cartelas?: number;
  winStack?: number;
}

// UI State Types
export interface DisplayState {
  isConnected: boolean;
  connectionError: string | null;
  isLoading: boolean;
  selectedLanguage: Language;
  isFullScreen: boolean;
  showGameHistory: boolean;
  showTop3Winners: boolean;
  showVerificationModal: boolean;
  modalPersistent: boolean;
  isDrawing: boolean;
  show3DMixer?: boolean;
  isShuffling?: boolean;
}

export type Language = 'AM' | 'OR' | 'TG';

// BINGO Board Types
export interface BingoColumn {
  letter: string;
  numbers: number[];
}

export interface BingoNumber {
  value: number;
  isCalled: boolean;
  isCurrent: boolean;
  column: string;
}

export interface DisplayStatusData {
  // Interface for display status events - can be extended later
  timestamp?: Date;
  message?: string;
} 