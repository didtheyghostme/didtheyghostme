import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, userAgent } from "next/server";

import { createRateLimitResponse } from "@/lib/errorHandling";
import { jobLimiters, othersLimiters, companyLimiters, settingsLimiters, createFallbackRateLimiters } from "@/lib/rateLimit";
import { RateLimitRouteType, OperationType } from "@/lib/rateLimitConfig";
import { MIXPANEL_COOKIE_NAME } from "@/lib/constants/mixpanelCookie";
import { getClientIp } from "@/lib/getClientIp";
import { API } from "@/lib/constants/apiRoutes";

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

  const userId = session?.userId;

  // First check: Protects API routes (requires authentication)

  if (isProtectedRoute(req)) {
    if (!userId) {
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
    const ip = getClientIp(req.headers);
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

  const url = new URL(req.url);
  const pathname = url.pathname;

  // Only track actual page views (not API calls, static assets, files in public folder etc.)
  const isPageRequest = !pathname.startsWith("/api/") && !pathname.startsWith("/_next/") && !pathname.startsWith("/static/") && !pathname.startsWith("/assets/") && !pathname.includes(".");

  // https://github.com/vercel/next.js/discussions/37736 - handle prefetch in middleware nextjs
  const isPrefetch = req.headers.get("sec-fetch-mode") === "cors" && req.headers.get("sec-fetch-dest") === "empty" && req.headers.get("next-url") !== null;

  if (isPageRequest && !isPrefetch) {
    let response = NextResponse.next();

    // Get IP for geolocation
    const clientIp = getClientIp(req.headers);

    // Check for existing device ID cookie
    const cookieStore = req.cookies;
    let deviceId = cookieStore.get(MIXPANEL_COOKIE_NAME)?.value;

    // Generate new device ID if needed
    if (!deviceId) {
      deviceId = crypto.randomUUID();

      // Set the cookie in the response
      response.cookies.set({
        name: MIXPANEL_COOKIE_NAME,
        value: deviceId,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // same as mixpanel default
      });
    }

    const { device, browser, os, isBot, ua } = userAgent(req);

    const userAgentData = {
      // Browser properties
      $browser: browser.name,
      $browser_version: browser.version,

      // OS properties
      $os: os.name,
      $os_version: os.version,

      // Device properties (if available)
      $device: device.vendor,
      $model: device.model,

      userAgent: ua,
      isBot,
    };

    // Instead of direct tracking, make a fetch request to our API
    // NOTE: middleware node runtime can be used if upgrade to nextjs 15
    // Fire and forget, Don't await this to avoid delaying page loads
    fetch(`${url.origin}${API.MIXPANEL_TRACK.pageView}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        $current_url: req.url,
        referrer: req.headers.get("referer") || undefined,
        ip: clientIp,
        $device_id: deviceId,
        isNewDeviceId: !cookieStore.get(MIXPANEL_COOKIE_NAME)?.value, // Add this flag to indicate to route handler
        callFrom: "middleware",
        ...userAgentData,
        ...(userId ? { user_id: userId } : {}), // Conditionally add user_id
        // Add any UTM params from the URL if present
        ...Object.fromEntries(Array.from(url.searchParams.entries()).filter(([key]) => key.startsWith("utm_"))),
      }),
    }).catch((error) => {
      // Silently log errors but don't block the request
      console.error("Middleware failed to send page view to analytics API:", error);
    });

    return response;
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
