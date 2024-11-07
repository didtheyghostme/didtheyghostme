import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const RATE_LIMITS = {
  READ_LIMIT: 50, // requests per window
  WRITE_LIMIT: 10, // requests per window
  SERVER_ACTION_LIMIT: 20, // requests per window
  WINDOW_SIZE: 60, // in seconds
} as const;

// Create a new Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// For read operations (GET requests)
export const readRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.READ_LIMIT, `${RATE_LIMITS.WINDOW_SIZE} s`), // 50 requests per minute
  analytics: true,
  prefix: "@upstash/ratelimit:read",
});

// For write operations (POST/PUT/DELETE)
export const writeRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.WRITE_LIMIT, `${RATE_LIMITS.WINDOW_SIZE} s`), // 10 requests per minute
  analytics: true,
  prefix: "@upstash/ratelimit:write",
});

// Add this to your existing rate limiters
export const serverActionLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.SERVER_ACTION_LIMIT, `${RATE_LIMITS.WINDOW_SIZE} s`), // 20 requests per minute
  analytics: true,
  prefix: "@upstash/ratelimit:server-action",
});
