import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";

import { ERROR_MESSAGES, isRateLimitError } from "./errorHandling";
import { companyLimiters, createFallbackRateLimiters, isUpstashDailyLimitError, jobLimiters, othersLimiters, settingsLimiters } from "./rateLimit";
import { RateLimitRouteType } from "./rateLimitConfig";
import { getClientIp } from "./getClientIp";

import { mpServerTrack } from "@/lib/mixpanelServer";

type EndpointName = "CreateJob" | "CreateCompany" | "CreateComment" | "TrackApplication" | "ReportAdmin" | "UpdateInterviewRounds" | "UpdateComment" | "UpdateUserPreferences";

export async function withRateLimit<T>(action: (user_id: string) => Promise<T>, endpointName: EndpointName): Promise<T> {
  const { userId: user_id } = auth();

  const ip = getClientIp(headers());

  if (!user_id) {
    await mpServerTrack("Authentication error rate limit", {
      endpoint_name: endpointName,
      ip_address: ip,
    });
    throw new Error("User not authenticated");
  }

  const routeType: RateLimitRouteType = endpointName === "CreateJob" ? "JOB" : endpointName === "CreateCompany" ? "COMPANY" : "OTHERS";

  try {
    // Try primary Upstash limiters
    const limiters = {
      JOB: jobLimiters,
      COMPANY: companyLimiters,
      SETTINGS: settingsLimiters,
      OTHERS: othersLimiters,
    }[routeType];

    const [burstResult, sustainedResult] = await Promise.all([limiters.burstWrite.limit(user_id), limiters.sustainedWrite.limit(user_id)]);

    if (!burstResult.success || !sustainedResult.success) {
      await mpServerTrack("Rate limit exceeded", {
        limiter_type: "Primary",
        route_type: routeType,
        endpoint_name: endpointName,
        attempts_made: burstResult.limit - burstResult.remaining,
        window_type: burstResult.success ? "BURST" : "SUSTAINED",
        ip_address: ip,
        ...(user_id ? { user_id } : {}),
      });
      throw new Error(ERROR_MESSAGES.TOO_MANY_REQUESTS);
    }
  } catch (error) {
    if (isRateLimitError(error)) throw error;

    // If Upstash fails, use memory cache fallback
    if (isUpstashDailyLimitError(error)) {
      // console.error("error name", error.name);
      const [burstFallback, sustainedFallback] = await createFallbackRateLimiters({ routeType, operation: "WRITE", rateLimitKey: user_id });

      if (!burstFallback.success || !sustainedFallback.success) {
        const failedLimit = !burstFallback.success ? burstFallback : sustainedFallback;
        const windowType = !burstFallback.success ? "BURST" : "SUSTAINED";

        await mpServerTrack("Rate limit exceeded", {
          limiter_type: "Fallback",
          route_type: routeType,
          endpoint_name: endpointName,
          attempts_made: failedLimit.limit - failedLimit.remaining,
          window_type: windowType,
          ip_address: ip,
          ...(user_id ? { user_id } : {}),
        });

        throw new Error(ERROR_MESSAGES.TOO_MANY_REQUESTS);
      }
    }
  }

  return action(user_id);
}
