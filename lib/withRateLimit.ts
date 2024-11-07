import { cookies } from "next/headers";

import { RATE_LIMITS, serverActionLimiter } from "./rateLimit";
import { ERROR_MESSAGES, RateLimitError } from "./errorHandling";

export async function withRateLimit<T>(action: () => Promise<T>): Promise<T> {
  const cookieStore = cookies();
  const ip = cookieStore.get("x-real-ip")?.value ?? "127.0.0.1";

  const { success, reset } = await serverActionLimiter.limit(ip);

  if (!success) {
    const error = new Error(ERROR_MESSAGES.TOO_MANY_REQUESTS) as RateLimitError;

    error.cause = {
      reset,
      retryAfter: RATE_LIMITS.WINDOW_SIZE,
    };
    throw error;
  }

  return action();
}
