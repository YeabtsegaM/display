/**
 * Security utilities for the BINGO display application
 */

// Input validation
export function validateDisplayToken(token: string | null): boolean {
  if (!token) return false;
  
  // Basic validation - token should be a non-empty string
  if (typeof token !== 'string' || token.trim().length === 0) {
    return false;
  }
  
  // Token should be alphanumeric with some special characters
  const tokenRegex = /^[a-zA-Z0-9\-_\.]+$/;
  return tokenRegex.test(token);
}

// XSS Prevention
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [now]);
      return true;
    }

    const requests = this.requests.get(identifier)!;
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Error handling
export function createErrorHandler() {
  return {
    handleError: (error: Error, context: string) => {
      console.error(`[${context}] Error:`, error);
      
      // In production, you might want to send this to an error tracking service
      if (process.env.NODE_ENV === 'production') {
        // Send to error tracking service (e.g., Sentry)
        // captureException(error);
      }
    },
    
    handleAsyncError: async <T>(
      promise: Promise<T>,
      context: string
    ): Promise<T | null> => {
      try {
        return await promise;
      } catch (error) {
        console.error(`[${context}] Error:`, error);
        return null;
      }
    }
  };
}

// Memory leak prevention
export function createMemoryManager() {
  const cleanupTasks: (() => void)[] = [];
  
  return {
    addCleanupTask: (task: () => void) => {
      cleanupTasks.push(task);
    },
    
    cleanup: () => {
      cleanupTasks.forEach(task => {
        try {
          task();
        } catch (error) {
          console.error('Cleanup task failed:', error);
        }
      });
      cleanupTasks.length = 0;
    }
  };
}

// Secure random ID generation
export function generateSecureId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto API
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

// Data encryption helper (for sensitive data)
export function encryptData(data: string, key: string): string {
  // This is a simple example - in production, use a proper encryption library
  return btoa(data + key);
}

export function decryptData(encryptedData: string, key: string): string {
  try {
    const decoded = atob(encryptedData);
    return decoded.replace(key, '');
  } catch {
    return '';
  }
}

// Input sanitization for different data types
export const sanitizers = {
  string: (value: unknown): string => {
    if (typeof value !== 'string') return '';
    return sanitizeInput(value);
  },
  
  number: (value: unknown): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  },
  
  boolean: (value: unknown): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return false;
  },
  
  array: (value: unknown): unknown[] => {
    if (!Array.isArray(value)) return [];
    return value.filter(item => item !== null && item !== undefined);
  }
}; 