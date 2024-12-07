import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createRateLimitResponse } from "@/lib/errorHandling";
import { jobLimiters, othersLimiters, companyLimiters, countryLimiters, createFallbackRateLimiters, experienceLevelLimiters, jobCategoryLimiters } from "@/lib/rateLimit";
import { RateLimitRouteType, OperationType } from "@/lib/rateLimitConfig";
import { getUpstashFailedStatus, setUpstashFailedStatus } from "@/lib/rateLimitFallbackRedis";

const isProtectedRoute = createRouteMatcher(["/applications", "/settings"]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Update route matchers to match RouteType
const isJobRoutes = createRouteMatcher(["/api/job(.*)"]);
const isCompanyRoutes = createRouteMatcher(["/api/company(.*)"]);
const isOtherRoutes = createRouteMatcher(["/api/comment(.*)", "/api/application(.*)"]);
const isCountryRoutes = createRouteMatcher(["/api/country(.*)"]);
const isExperienceLevelRoutes = createRouteMatcher(["/api/experience-level(.*)"]);
const isJobCategoryRoutes = createRouteMatcher(["/api/job-category(.*)"]);

async function handleFallbackRateLimiting(params: { routeType: RateLimitRouteType; operation: OperationType; ip: string }): Promise<boolean> {
  const [burstFallback, sustainedFallback] = await createFallbackRateLimiters({
    routeType: params.routeType,
    operation: params.operation,
    ip: params.ip,
  });

  return burstFallback.success && sustainedFallback.success;
}

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
      const url = new URL("/", req.url);

      return NextResponse.redirect(url);
    }

    // Admin users bypass rate limiting
    return NextResponse.next();
  }

  // Third check: Apply rate limiting only for matched routes
  let limiters;

  if (isJobRoutes(req)) limiters = jobLimiters;
  else if (isCompanyRoutes(req)) limiters = companyLimiters;
  else if (isCountryRoutes(req)) limiters = countryLimiters;
  else if (isExperienceLevelRoutes(req)) limiters = experienceLevelLimiters;
  else if (isOtherRoutes(req)) limiters = othersLimiters;
  else if (isJobCategoryRoutes(req)) limiters = jobCategoryLimiters;

  if (limiters) {
    // Choose rate limiter based on HTTP method
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const isRead = ["GET", "HEAD"].includes(req.method);
    const routeType: RateLimitRouteType = isJobRoutes(req) ? "JOB" : isCompanyRoutes(req) ? "COMPANY" : "OTHERS";
    const operation: OperationType = isRead ? "READ" : "WRITE";

    // Check if Upstash is in failed state
    const isUpstashFailed = await getUpstashFailedStatus();

    if (isUpstashFailed) {
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
      // console.warn("Upstash rate limiter failed:", error);

      await setUpstashFailedStatus();

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
