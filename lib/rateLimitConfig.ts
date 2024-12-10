// Types
export type WindowType = "BURST" | "SUSTAINED";
export type OperationType = "READ" | "WRITE";
export const RATE_LIMIT_ROUTES = ["JOB", "COMPANY", "SETTINGS", "OTHERS"] as const;

export type RateLimitRouteType = (typeof RATE_LIMIT_ROUTES)[number];

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
      READ: 40, // Higher limit for backend search
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

  // Settings routes (frontend filtered, write is same as job (in same RPC so unused))
  SETTINGS: {
    BURST: {
      READ: 40,
      WRITE: 10,
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
