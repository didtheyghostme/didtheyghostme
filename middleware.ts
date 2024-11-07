import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createRateLimitResponse } from "@/lib/errorHandling";
import { jobLimiters, othersLimiters, companyLimiters, isUpstashDailyLimitError, createFallbackRateLimiters } from "@/lib/rateLimit";
import { RateLimitRouteType, OperationType } from "@/lib/rateLimitConfig";
const isProtectedRoute = createRouteMatcher(["/api/applications(.*)"]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Update route matchers to match RouteType
const isJobRoutes = createRouteMatcher(["/api/job(.*)"]);
const isCompanyRoutes = createRouteMatcher(["/api/company(.*)"]);
const isOtherRoutes = createRouteMatcher(["/api/comment(.*)", "/api/application(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const session = await auth();

  // First check: Protects API routes (requires authentication)
  if (isProtectedRoute(req)) {
    await auth().protect();
  }

  // Second check: Protects admin routes (requires admin role)
  if (isAdminRoute(req)) {
    if (session?.sessionClaims?.metadata?.role !== "admin") {
      const url = new URL("/", req.url);

      return NextResponse.redirect(url);
    }

    // Admin users bypass rate limiting
    return;
  }

  // Third check: Apply rate limiting only for matched routes
  let limiters;

  if (isJobRoutes(req)) limiters = jobLimiters;
  else if (isCompanyRoutes(req)) limiters = companyLimiters;
  else if (isOtherRoutes(req)) limiters = othersLimiters;

  if (limiters) {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";

    // Choose rate limiter based on HTTP method
    const isRead = ["GET", "HEAD"].includes(req.method);

    // Use both burst and sustained limiters
    const burstLimiter = isRead ? limiters.burstRead : limiters.burstWrite;
    const sustainedLimiter = isRead ? limiters.sustainedRead : limiters.sustainedWrite;

    // Check both limits
    try {
      // Try primary limiters first
      const [burstResult, sustainedResult] = await Promise.all([burstLimiter.limit(ip), sustainedLimiter.limit(ip)]);

      // If rate limit exceeded, return 429 immediately
      if (!burstResult.success || !sustainedResult.success) {
        console.error("upstash rate limit exceeded...");
        const response = createRateLimitResponse("primary");

        return NextResponse.json(response, { status: 429 });
      }
    } catch (error) {
      // Only use fallback if Upstash fails (connection error, etc)
      console.warn("Upstash rate limiter failed, using fallback:", error);

      if (isUpstashDailyLimitError(error)) {
        const routeType: RateLimitRouteType = isJobRoutes(req) ? "JOB" : isCompanyRoutes(req) ? "COMPANY" : "OTHERS";
        const operation: OperationType = isRead ? "READ" : "WRITE";

        const [burstFallback, sustainedFallback] = await createFallbackRateLimiters({ routeType, operation, ip });

        if (!burstFallback.success || !sustainedFallback.success) {
          const response = createRateLimitResponse("fallback");

          return NextResponse.json(response, { status: 429 });
        }
      }
    }
  }
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
