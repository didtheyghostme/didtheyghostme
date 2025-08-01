import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { errors as UpstashErrors } from "@upstash/redis";

import { FallbackRateLimiter } from "./rateLimitFallback";
import { RateLimitRouteType, OperationType, WindowType, RATE_LIMITS, RATE_LIMIT_ROUTES } from "./rateLimitConfig";

// Environment Variables
const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Missing Upstash Redis environment variables: UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN");
}

// Create a new Redis instance
const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL!,
  token: UPSTASH_REDIS_REST_TOKEN!,
});

function createLimiter(limit: number, window: number, prefix: string) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${window} s`),
    analytics: true,
    prefix: `@upstash/ratelimit:${prefix}`,
    enableProtection: true,
  });
}

const operations = ["READ", "WRITE"] as const satisfies readonly OperationType[];
const windows = ["BURST", "SUSTAINED"] as const satisfies readonly WindowType[];

// Create limiters using a loop
type LimiterKey = `${Lowercase<RateLimitRouteType>}-${Lowercase<WindowType>}-${Lowercase<OperationType>}`;

export const limiters = {} as Record<LimiterKey, Ratelimit>;

for (const route of RATE_LIMIT_ROUTES) {
  for (const window of windows) {
    for (const operation of operations) {
      const limit = RATE_LIMITS[route][window][operation];
      const windowSize = RATE_LIMITS[`${window}_WINDOW`];
      const key = `${route.toLowerCase()}-${window.toLowerCase()}-${operation.toLowerCase()}` as LimiterKey;

      limiters[key] = createLimiter(limit, windowSize, key);
    }
  }
}

export const jobLimiters = {
  burstRead: limiters["job-burst-read"],
  burstWrite: limiters["job-burst-write"],
  sustainedRead: limiters["job-sustained-read"],
  sustainedWrite: limiters["job-sustained-write"],
};

export const companyLimiters = {
  burstRead: limiters["company-burst-read"],
  burstWrite: limiters["company-burst-write"],
  sustainedRead: limiters["company-sustained-read"],
  sustainedWrite: limiters["company-sustained-write"],
};

export const settingsLimiters = {
  burstRead: limiters["settings-burst-read"],
  burstWrite: limiters["settings-burst-write"],
  sustainedRead: limiters["settings-sustained-read"],
  sustainedWrite: limiters["settings-sustained-write"],
};

export const othersLimiters = {
  burstRead: limiters["others-burst-read"],
  burstWrite: limiters["others-burst-write"],
  sustainedRead: limiters["others-sustained-read"],
  sustainedWrite: limiters["others-sustained-write"],
};

// Type guard for Upstash errors
export function isUpstashDailyLimitError(error: unknown): boolean {
  return error instanceof UpstashErrors.UpstashError && error.message.includes("max daily request limit exceeded");
}

type CreateFallbackRateLimitersProp = {
  routeType: RateLimitRouteType;
  operation: OperationType;
  ip: string;
};

export async function createFallbackRateLimiters({ routeType, operation, ip }: CreateFallbackRateLimitersProp) {
  const burstLimiter = new FallbackRateLimiter(routeType, "BURST", operation);
  const sustainedLimiter = new FallbackRateLimiter(routeType, "SUSTAINED", operation);

  return Promise.all([burstLimiter.limit(ip), sustainedLimiter.limit(ip)]);
}

export const sharedRedis = redis; // Reuse existing connection
