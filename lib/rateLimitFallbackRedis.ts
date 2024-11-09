import { Redis } from "@upstash/redis";

const UPSTASH_STATUS_KEY = "upstash_rate_limit_status";
const UPSTASH_STATUS_TTL = 24 * 60 * 60; // 24 hours in seconds

const { UPSTASH_STATUS_REDIS_URL, UPSTASH_STATUS_REDIS_TOKEN } = process.env;

// Check environment variables
if (!UPSTASH_STATUS_REDIS_URL || !UPSTASH_STATUS_REDIS_TOKEN) {
  throw new Error("Missing Upstash Status Redis environment variables: UPSTASH_STATUS_REDIS_URL and/or UPSTASH_STATUS_REDIS_TOKEN");
}

// Create a separate Redis instance with different token
const statusRedis = new Redis({
  url: UPSTASH_STATUS_REDIS_URL,
  token: UPSTASH_STATUS_REDIS_TOKEN,
});

export async function setUpstashFailedStatus(): Promise<void> {
  await statusRedis.set(UPSTASH_STATUS_KEY, "1", { ex: UPSTASH_STATUS_TTL });
}

export async function getUpstashFailedStatus(): Promise<boolean> {
  const status = await statusRedis.get(UPSTASH_STATUS_KEY);

  return !!status;
}
