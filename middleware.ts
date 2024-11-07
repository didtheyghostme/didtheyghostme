import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { writeRateLimiter, readRateLimiter, RATE_LIMITS } from "@/lib/rateLimit";
const isProtectedRoute = createRouteMatcher(["/api/applications(.*)"]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const isRateLimitedRoute = createRouteMatcher(["/api/comment(.*)", "/api/applications(.*)", "/api/job(.*)", "/api/company(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // First: Apply rate limiting to specific routes
  if (isRateLimitedRoute(req)) {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    // Choose rate limiter based on HTTP method
    const limiter = ["GET", "HEAD"].includes(req.method) ? readRateLimiter : writeRateLimiter;

    const { success, limit, reset, remaining } = await limiter.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": RATE_LIMITS.WINDOW_SIZE.toString(),
          },
        },
      );
    }
  }

  // Second check: Protects API routes (requires authentication)
  if (isProtectedRoute(req)) {
    await auth().protect();
  }

  // Third check: Protects admin routes (requires admin role)
  if (isAdminRoute(req) && (await auth()).sessionClaims?.metadata?.role !== "admin") {
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
};
