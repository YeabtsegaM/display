// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
  SOCKET_TIMEOUT: 10000,
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000,
} as const;

// BINGO Game Constants
export const BINGO_CONFIG = {
  TOTAL_NUMBERS: 75,
  COLUMNS: {
    B: { min: 1, max: 15, letter: 'B' },
    I: { min: 16, max: 30, letter: 'I' },
    N: { min: 31, max: 45, letter: 'N' },
    G: { min: 46, max: 60, letter: 'G' },
    O: { min: 61, max: 75, letter: 'O' },
  },
} as const;

// Animation Durations
export const ANIMATION_DURATIONS = {
  DRAWING: 2000,
  SHIMMER: 3000,
  FLOAT: 4000,
  KENO_BOUNCE: 1500,
  KENO_GLOW: 2000,
  KENO_SHINE: 3000,
} as const;

// UI Constants
export const UI_CONFIG = {
  DRAWING_DELAY: 2000,
  MODAL_PERSISTENT_DELAY: 5000,
  MAX_RECENT_NUMBERS: 3,
} as const;

// Language Configuration
export const LANGUAGES = {
  AM: { flag: '🇪🇹', name: 'Amharic' },
  OR: { flag: '🔴⚫', name: 'Oromo' },
  TG: { flag: '🔴🟡', name: 'Tigrinya' },
} as const;

// Currency Configuration
export const CURRENCY = {
  SYMBOL: 'Br.',
  DECIMAL_PLACES: 0,
} as const;

// Socket Event Names
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ERROR: 'reconnect_error',
  GAME_START: 'game_start',
  NUMBER_CALLED: 'number_called',
  GAME_END: 'game_end',
  GAME_CREATED: 'game:created',
  GAME_STARTED: 'game_started',
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',
  GAME_RESET: 'game:reset',
  GAME_ENDED: 'game_ended',
  NUMBER_DRAWN: 'number_drawn',
  GAME_UPDATE: 'game:update',
  CARTELA_VERIFIED: 'cartela_verified',
  CLOSE_VERIFICATION_MODAL: 'close-verification-modal',
  DISPLAY_UNAUTHORIZED: 'display:unauthorized',
  JOIN_GAME: 'join_game',
  LEAVE_GAME: 'leave_game',
  START_GAME: 'start_game',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NO_TOKEN: 'No display token provided in URL',
  CONNECTION_FAILED: 'Failed to connect to server',
  CONNECTION_LOST: 'Connection lost. Attempting to reconnect...',
  INVALID_TOKEN: 'Invalid display token!',
  RECONNECTION_FAILED: 'Reconnection failed',
  INITIALIZATION_FAILED: 'Failed to initialize connection',
} as const;

// Status Messages
export const STATUS_MESSAGES = {
  CONNECTING: 'Connecting to BINGO server...',
  CONNECTED: 'Connected',
  DISCONNECTED: 'Disconnected',
  DRAWING: '✨ Drawing...',
  READY_TO_START: 'Ready to Start',
  GAME_ACTIVE: 'Game Active',
  NO_NUMBERS_CALLED: '🎯 No numbers called yet',
} as const; 