import { LRUCache } from "lru-cache";

import { RATE_LIMITS, RateLimitRouteType, WindowType, OperationType } from "./rateLimitConfig";

// Explicitly type the cache to store arrays
const burstCache = new LRUCache<string, number[]>({
  max: 5000,
  ttl: RATE_LIMITS.BURST_WINDOW * 1000,
  noDisposeOnSet: true,
  updateAgeOnGet: true,
});

const sustainedCache = new LRUCache<string, number[]>({
  max: 5000,
  ttl: RATE_LIMITS.SUSTAINED_WINDOW * 1000,
  noDisposeOnSet: true,
  updateAgeOnGet: true,
});

export class FallbackRateLimiter {
  constructor(
    private routeType: RateLimitRouteType,
    private window: WindowType,
    private operation: OperationType,
  ) {}

  async limit(key: string) {
    const cache = this.window === "BURST" ? burstCache : sustainedCache;
    const windowMs = RATE_LIMITS[`${this.window}_WINDOW`] * 1000;
    const limit = RATE_LIMITS[this.routeType][this.window][this.operation];
    const cacheKey = `${this.routeType}:${this.window}:${this.operation}:${key}`;
    const now = Date.now();

    // Get existing timestamps and ensure it's an array
    const timestamps = cache.get(cacheKey) ?? [];

    // Filter out expired timestamps (older than window)
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    // Check if we're under the limit BEFORE adding the new timestamp
    const isUnderLimit = validTimestamps.length < limit;

    // Only add the new timestamp if we're under the limit
    if (isUnderLimit) {
      validTimestamps.push(now);
      cache.set(cacheKey, validTimestamps);
    }

    // Calculate when the oldest request will expire
    const oldestTimestamp = validTimestamps.length > 0 ? Math.min(...validTimestamps) : now;
    const resetTime = oldestTimestamp + windowMs;

    return {
      success: isUnderLimit,
      limit,
      remaining: Math.max(0, limit - validTimestamps.length),
      reset: resetTime,
    };
  }
}
