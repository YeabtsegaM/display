import { BINGO_CONFIG, CURRENCY } from './constants';
import type { BingoColumn } from '../types';

/**
 * Get the BINGO column letter for a given number
 */
export function getColumnForNumber(number: number): string {
  if (number >= 1 && number <= 15) return 'B';
  if (number >= 16 && number <= 30) return 'I';
  if (number >= 31 && number <= 45) return 'N';
  if (number >= 46 && number <= 60) return 'G';
  if (number >= 61 && number <= 75) return 'O';
  return '';
}

/**
 * Check if a number has been called
 */
export function isNumberCalled(number: number, calledNumbers: number[]): boolean {
  return calledNumbers.includes(number);
}

/**
 * Generate BINGO board columns with numbers
 */
export function generateBingoColumns(): BingoColumn[] {
  return [
    { letter: 'B', numbers: Array.from({ length: 15 }, (_, i) => i + 1) },
    { letter: 'I', numbers: Array.from({ length: 15 }, (_, i) => i + 16) },
    { letter: 'N', numbers: Array.from({ length: 15 }, (_, i) => i + 31) },
    { letter: 'G', numbers: Array.from({ length: 15 }, (_, i) => i + 46) },
    { letter: 'O', numbers: Array.from({ length: 15 }, (_, i) => i + 61) },
  ];
}

/**
 * Format currency value with symbol
 */
export function formatCurrency(amount: number): string {
  return `${CURRENCY.SYMBOL} ${amount.toLocaleString()}`;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(calledNumbers: number[]): number {
  return (calledNumbers.length / BINGO_CONFIG.TOTAL_NUMBERS) * 100;
}

/**
 * Get language flag emoji
 */
export function getLanguageFlag(lang: string): string {
  switch(lang) {
    case 'AM': return '🇪🇹';
    case 'OR': return '🔴⚫';
    case 'TG': return '🔴🟡';
    default: return '🇪🇹';
  }
}

/**
 * Check if position is part of winning pattern
 */
export function isPositionInWinningPattern(
  rowIndex: number,
  colIndex: number,
  winningPatternDetails?: {
    patternName: string;
    pattern: boolean[][];
    matchedPositions: number[][];
  }
): boolean {
  if (!winningPatternDetails || !winningPatternDetails.pattern) {
    return false;
  }
  
  // Check if this position is part of the winning pattern
  // The pattern shows which cells are required, and matchedPositions shows which are actually matched
  const isInPattern = winningPatternDetails.pattern[rowIndex]?.[colIndex] === true;
  const isMatched = winningPatternDetails.matchedPositions?.some(
    pos => pos[0] === rowIndex && pos[1] === colIndex
  );
  
  // A position is in the winning pattern if it's both in the pattern AND matched
  // OR if it's the center cell (2,2) which is always free space
  return (isInPattern && isMatched) || (rowIndex === 2 && colIndex === 2);
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Validate BINGO number
 */
export function isValidBingoNumber(number: number): boolean {
  return number >= 1 && number <= BINGO_CONFIG.TOTAL_NUMBERS;
}

/**
 * Get recent numbers (last N)
 */
export function getRecentNumbers(calledNumbers: number[], count: number = 3): number[] {
  return calledNumbers.slice(-count);
}

/**
 * Format game duration
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Check if browser supports fullscreen
 */
export function isFullscreenSupported(): boolean {
  return !!(
    document.fullscreenEnabled ||
    (document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
    (document as unknown as { mozFullScreenEnabled?: boolean }).mozFullScreenEnabled ||
    (document as unknown as { msFullscreenEnabled?: boolean }).msFullscreenEnabled
  );
}

/**
 * Request fullscreen with cross-browser support
 */
export async function requestFullscreen(element: HTMLElement): Promise<void> {
  if (element.requestFullscreen) {
    await element.requestFullscreen();
  } else if ((element as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
    await (element as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
  } else if ((element as unknown as { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen) {
    await (element as unknown as { mozRequestFullScreen: () => Promise<void> }).mozRequestFullScreen();
  } else if ((element as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
    await (element as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
  }
}

/**
 * Exit fullscreen with cross-browser support
 */
export async function exitFullscreen(): Promise<void> {
  if (document.exitFullscreen) {
    await document.exitFullscreen();
  } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
    await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
  } else if ((document as unknown as { mozCancelFullScreen?: () => Promise<void> }).mozCancelFullScreen) {
    await (document as unknown as { mozCancelFullScreen: () => Promise<void> }).mozCancelFullScreen();
  } else if ((document as unknown as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
    await (document as unknown as { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
  }
} 

/**
 * Validate if a string is a valid UUID format
 * UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function isValidUUID(token: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}

/**
 * Validate display token format
 */
export function validateDisplayToken(token: string | null): boolean {
  if (!token) return false;
  return isValidUUID(token);
} 

/**
 * Extract the game ID number from a game ID string
 * @param gameId - The game ID string (e.g., "100000" or "100001")
 * @returns The game ID number (e.g., 100000, 100001, 100002)
 */
export function extractGameIdNumber(gameId: string | undefined): number {
  if (!gameId) return 0;
  
  // Handle clean 6-digit format (100000, 100001, etc.)
  const parsedId = parseInt(gameId, 10);
  return isNaN(parsedId) ? 0 : parsedId;
}

/**
 * Format game ID for display
 * @param gameId - The game ID (can be string or number)
 * @returns Formatted game ID for display
 */
export function formatGameIdForDisplay(gameId: string | number | undefined): string {
  if (!gameId) return '0';
  
  if (typeof gameId === 'number') {
    return gameId.toString();
  }
  
  // Handle clean 6-digit format (100000, 100001, etc.)
  const parsedId = parseInt(gameId, 10);
  return isNaN(parsedId) ? '0' : parsedId.toString();
}

/**
 * Get the numeric value from a game ID
 * @param gameId - The game ID string or number
 * @returns The numeric value of the game ID
 */
export function getGameIdNumber(gameId: string | number | undefined): number {
  if (!gameId) return 0;
  
  if (typeof gameId === 'number') {
    return gameId;
  }
  
  // Handle clean 6-digit format (100000, 100001, etc.)
  const parsedId = parseInt(gameId, 10);
  return isNaN(parsedId) ? 0 : parsedId;
} 