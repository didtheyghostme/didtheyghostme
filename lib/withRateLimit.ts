import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

import { ERROR_MESSAGES, RateLimitError } from "./errorHandling";
import { companyLimiters, jobLimiters, othersLimiters, RateLimitRouteType } from "./rateLimit";
import { mixpanel } from "./mixpanelServer";

type EndpointName = "CreateJob" | "CreateCompany" | "CreateComment" | "TrackApplication" | "ReportAdmin" | "UpdateInterviewRounds";

export async function withRateLimit<T>(action: (user_id: string) => Promise<T>, endpointName: EndpointName): Promise<T> {
  const { userId: user_id } = auth();

  if (!user_id) {
    throw new Error("User not authenticated");
  }

  const cookieStore = cookies();
  const ip = cookieStore.get("x-real-ip")?.value ?? "127.0.0.1";

  const actionType: RateLimitRouteType = endpointName === "CreateJob" ? "JOB" : endpointName === "CreateCompany" ? "COMPANY" : "OTHERS";

  const limiters = {
    JOB: jobLimiters,
    COMPANY: companyLimiters,
    OTHERS: othersLimiters,
  }[actionType];

  // Check both burst and sustained limits
  const [burstResult, sustainedResult] = await Promise.all([limiters.burstWrite.limit(ip), limiters.sustainedWrite.limit(ip)]);

  if (!burstResult.success || !sustainedResult.success) {
    const failedLimit = !burstResult.success ? burstResult : sustainedResult;
    const windowType = !burstResult.success ? "BURST" : "SUSTAINED";

    await mixpanel.track("Rate limit violation", {
      distinct_id: user_id || `anon_${ip}`, // Use userId if available, fallback to anon_ip
      type: "server_action",
      action_type: actionType,
      endpoint_name: endpointName,
      attempts_made: failedLimit.limit - failedLimit.remaining,
      window_type: windowType,
      ip_address: ip,
    });

    throw new Error(ERROR_MESSAGES.TOO_MANY_REQUESTS) as RateLimitError;
  }

  return action(user_id);
}
