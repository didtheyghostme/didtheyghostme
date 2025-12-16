// NOTE: if upgrade to Next.js 15+, headers() need to be awaited before using it

type HeadersLike = { get(name: string): string | null };

/**
 * Extracts the client IP address from request headers.
 *
 * Checks headers in order:
 * 1. `x-forwarded-for` (first IP in chain if multiple)
 * 2. `x-real-ip` (fallback)
 * 3. `"unknown"` (if neither header is present)
 *
 * @param headers - Headers object with `.get()` method (compatible with Next.js headers, NextRequest.headers, etc.)
 * @returns Client IP address string, or "unknown" if not found
 *
 * @example
 *
 * // In server action
 * const headersList = headers();
 * const ip = getClientIp(headersList);
 *
 * // In API route
 * const ip = getClientIp(request.headers);
 *
 * // In middleware
 * const ip = getClientIp(req.headers);
 *  */
export function getClientIp(headers: HeadersLike): string {
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");

  return forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "unknown";
}
