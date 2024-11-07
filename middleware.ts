import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { ERROR_MESSAGES } from "./lib/errorHandling";

import { jobLimiters, othersLimiters, companyLimiters } from "@/lib/rateLimit";
const isProtectedRoute = createRouteMatcher(["/api/applications(.*)"]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// Update route matchers to match RouteType
const isJobRoutes = createRouteMatcher(["/api/job(.*)"]);
const isCompanyRoutes = createRouteMatcher(["/api/company(.*)"]);
const isOtherRoutes = createRouteMatcher(["/api/comment(.*)", "/api/application(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const session = await auth();

  // Apply rate limiting only for matched routes
  let limiters;

  if (isJobRoutes(req)) limiters = jobLimiters;
  else if (isCompanyRoutes(req)) limiters = companyLimiters;
  else if (isOtherRoutes(req)) limiters = othersLimiters;

  if (limiters) {
    // Skip rate limiting for admin
    if (session?.sessionClaims?.metadata?.role === "admin") return;

    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";

    // Choose rate limiter based on HTTP method
    const isRead = ["GET", "HEAD"].includes(req.method);

    // Use both burst and sustained limiters
    const burstLimiter = isRead ? limiters.burstRead : limiters.burstWrite;
    const sustainedLimiter = isRead ? limiters.sustainedRead : limiters.sustainedWrite;

    // Check both limits
    const [burstResult, sustainedResult] = await Promise.all([burstLimiter.limit(ip), sustainedLimiter.limit(ip)]);

    if (!burstResult.success || !sustainedResult.success) {
      return NextResponse.json({ error: ERROR_MESSAGES.TOO_MANY_REQUESTS }, { status: 429 });
    }
  }

  // Second check: Protects API routes (requires authentication)
  if (isProtectedRoute(req)) {
    await auth().protect();
  }

  // Third check: Protects admin routes (requires admin role)
  if (isAdminRoute(req) && session?.sessionClaims?.metadata?.role !== "admin") {
    const url = new URL("/", req.url);

    return NextResponse.redirect(url);
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
