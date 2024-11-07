import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Types
type WindowType = "BURST" | "SUSTAINED";
type OperationType = "READ" | "WRITE";
export type RateLimitRouteType = "JOB" | "COMPANY" | "OTHERS";

type RouteConfig = {
  [K in RateLimitRouteType]: {
    [W in WindowType]: {
      [O in OperationType]: number;
    };
  };
};

type RateLimitConfig = {
  BURST_WINDOW: number;
  SUSTAINED_WINDOW: number;
} & RouteConfig;

// Rate Limits Configuration
export const RATE_LIMITS: RateLimitConfig = {
  // Windows
  BURST_WINDOW: 10, // 10 seconds
  SUSTAINED_WINDOW: 60, // 1 minute

  // Job routes (higher limits for backend search)
  JOB: {
    BURST: {
      READ: 20, // Higher limit for backend search
      WRITE: 10, // Posting jobs still limited
    },
    SUSTAINED: {
      READ: 100, // Allow more searches over time
      WRITE: 30,
    },
  },

  // Company routes (frontend filtered, needs less bandwidth)
  COMPANY: {
    BURST: {
      READ: 20, // Lower since filtering is on frontend
      WRITE: 10, // Strict company creation/updates
    },
    SUSTAINED: {
      READ: 100,
      WRITE: 30,
    },
  },

  // Combined limits for comments and applications
  OTHERS: {
    BURST: {
      READ: 30, // Reading comments/applications
      WRITE: 10, // Posting comments or submitting applications
    },
    SUSTAINED: {
      READ: 150,
      WRITE: 60,
    },
  },
} as const;

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
  });
}

const routes = ["JOB", "COMPANY", "OTHERS"] as const satisfies readonly RateLimitRouteType[];
const operations = ["READ", "WRITE"] as const satisfies readonly OperationType[];
const windows = ["BURST", "SUSTAINED"] as const satisfies readonly WindowType[];

// Create limiters using a loop
type LimiterKey = `${Lowercase<RateLimitRouteType>}-${Lowercase<WindowType>}-${Lowercase<OperationType>}`;

export const limiters = {} as Record<LimiterKey, Ratelimit>;

for (const route of routes) {
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

export const othersLimiters = {
  burstRead: limiters["others-burst-read"],
  burstWrite: limiters["others-burst-write"],
  sustainedRead: limiters["others-sustained-read"],
  sustainedWrite: limiters["others-sustained-write"],
};
