import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createRateLimitResponse } from "@/lib/errorHandling";
import { jobLimiters, othersLimiters, companyLimiters, settingsLimiters, createFallbackRateLimiters } from "@/lib/rateLimit";
import { RateLimitRouteType, OperationType } from "@/lib/rateLimitConfig";

const isProtectedRoute = createRouteMatcher(["/applications", "/settings"]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Update route matchers to match RouteType
const isJobRoutes = createRouteMatcher(["/api/job(.*)"]);
const isCompanyRoutes = createRouteMatcher(["/api/company(.*)"]);
const isOtherRoutes = createRouteMatcher(["/api/comment(.*)", "/api/application(.*)"]);

const isSettingsRoutes = createRouteMatcher(["/api/settings(.*)"]);

async function handleFallbackRateLimiting(params: { routeType: RateLimitRouteType; operation: OperationType; ip: string }): Promise<boolean> {
  const [burstFallback, sustainedFallback] = await createFallbackRateLimiters({
    routeType: params.routeType,
    operation: params.operation,
    ip: params.ip,
  });

  return burstFallback.success && sustainedFallback.success;
}

// use environment variable to manually check status instead of relying on Upstash?
const IS_UPSTASH_FAILED = process.env.NEXT_PUBLIC_IS_UPSTASH_FAILED === "true";

export default clerkMiddleware(async (auth, req) => {
  const session = await auth();

  // First check: Protects API routes (requires authentication)

  if (isProtectedRoute(req)) {
    if (!session?.userId) {
      const redirectUrl = new URL(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/", req.url);

      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // Second check: Protects admin routes (requires admin role)
  if (isAdminRoute(req)) {
    if (session?.sessionClaims?.metadata?.role !== "admin") {
      const url = new URL(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in", req.url);

      return NextResponse.redirect(url);
    }

    // Admin users bypass rate limiting
    return NextResponse.next();
  }

  // Third check: Apply rate limiting only for matched routes
  let limiters;

  if (isJobRoutes(req)) limiters = jobLimiters;
  else if (isCompanyRoutes(req)) limiters = companyLimiters;
  else if (isSettingsRoutes(req)) limiters = settingsLimiters;
  else if (isOtherRoutes(req)) limiters = othersLimiters;

  if (limiters) {
    // Choose rate limiter based on HTTP method
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const isRead = ["GET", "HEAD"].includes(req.method);
    const routeType: RateLimitRouteType = isJobRoutes(req) ? "JOB" : isCompanyRoutes(req) ? "COMPANY" : isSettingsRoutes(req) ? "SETTINGS" : "OTHERS";
    const operation: OperationType = isRead ? "READ" : "WRITE";

    // Check if Upstash is in failed state
    // const isUpstashFailed = await getUpstashFailedStatus();

    if (IS_UPSTASH_FAILED) {
      const isFallbackSuccess = await handleFallbackRateLimiting({ routeType, operation, ip });

      if (!isFallbackSuccess) {
        return NextResponse.json(createRateLimitResponse("fallback"), { status: 429 });
      }

      return NextResponse.next();
    }

    try {
      const burstLimiter = isRead ? limiters.burstRead : limiters.burstWrite;
      const sustainedLimiter = isRead ? limiters.sustainedRead : limiters.sustainedWrite;

      const [burstResult, sustainedResult] = await Promise.all([burstLimiter.limit(ip), sustainedLimiter.limit(ip)]);

      if (!burstResult.success || !sustainedResult.success) {
        return NextResponse.json(createRateLimitResponse("primary"), { status: 429 });
      }
    } catch (error) {
      console.warn("Upstash rate limiter failed:", error);

      // await setUpstashFailedStatus();

      const isFallbackSuccess = await handleFallbackRateLimiting({ routeType, operation, ip });

      if (!isFallbackSuccess) {
        return NextResponse.json(createRateLimitResponse("fallback"), { status: 429 });
      }
    }
  }

  // Ensure the request proceeds if all checks pass
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
  runtime: "nodejs",
};
