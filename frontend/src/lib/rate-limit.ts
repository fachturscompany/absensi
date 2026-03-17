/**
 * Rate Limiting Utility
 * Prevents API abuse and ensures fair usage
 */

import { logger } from '@/lib/logger';

interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max number of unique tokens per interval
}

interface RateLimitStore {
  [key: string]: {
    tokens: Set<string>;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 50, // 50 requests per minute
  }) {
    this.options = options;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Check if request is rate limited
   */
  async check(identifier: string, token: string = 'default'): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const key = identifier;
    
    // Initialize or get existing rate limit data
    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        tokens: new Set(),
        resetTime: now + this.options.interval,
      };
    }

    const record = this.store[key];
    
    // Check if limit exceeded
    if (record.tokens.size >= this.options.uniqueTokenPerInterval) {
      logger.warn('Rate limit exceeded', { identifier, token });
      
      return {
        success: false,
        limit: this.options.uniqueTokenPerInterval,
        remaining: 0,
        reset: record.resetTime,
      };
    }

    // Add token to the set
    record.tokens.add(token);

    return {
      success: true,
      limit: this.options.uniqueTokenPerInterval,
      remaining: this.options.uniqueTokenPerInterval - record.tokens.size,
      reset: record.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now();
    
    Object.keys(this.store).forEach(key => {
      const entry = this.store[key];
      if (entry && entry.resetTime < now) {
        delete this.store[key];
      }
    });
  }

  /**
   * Reset rate limit for specific identifier
   */
  reset(identifier: string) {
    delete this.store[identifier];
  }

  /**
   * Get current status for identifier
   */
  getStatus(identifier: string): {
    isLimited: boolean;
    requestsUsed: number;
    resetTime: number;
  } | null {
    const record = this.store[identifier];
    
    if (!record) {
      return null;
    }

    const now = Date.now();
    
    if (record.resetTime < now) {
      return null;
    }

    return {
      isLimited: record.tokens.size >= this.options.uniqueTokenPerInterval,
      requestsUsed: record.tokens.size,
      resetTime: record.resetTime,
    };
  }
}

// Export rate limiters for different purposes
export const apiRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100, // 100 requests per minute
});

export const authRateLimiter = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 5, // 5 attempts per 15 minutes
});

export const uploadRateLimiter = new RateLimiter({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 20, // 20 uploads per hour
});

// Helper function for API routes
export async function checkRateLimit(
  request: Request,
  limiter: RateLimiter = apiRateLimiter
): Promise<Response | null> {
  const ip = getClientIp(request);
  const result = await limiter.check(ip);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null; // Request is not rate limited
}

// Get client IP from request
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? (forwarded.split(',')[0]?.trim() ?? 'unknown') : 'unknown';
  return ip;
}

// Middleware for rate limiting
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  limiter: RateLimiter = apiRateLimiter
) {
  return async (request: Request): Promise<Response> => {
    const rateLimitResponse = await checkRateLimit(request, limiter);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request);
  };
}
