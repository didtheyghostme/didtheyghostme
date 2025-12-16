import { NextRequest, NextResponse, userAgent } from "next/server";

import { mpServerTrack } from "@/lib/mixpanelServer";
import { sharedRedis } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/getClientIp";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { callFrom, isNewDeviceId, ...properties } = data;

    // If the device ID is new from middleware, skip tracking to prevent race condition duplicate events
    if (isNewDeviceId) {
      return NextResponse.json({ success: true, message: "Skipped tracking for new device ID" }, { status: 200 });
    }

    delete properties.isNewDeviceId; // Remove the flag before sending to Mixpanel

    const eventName = callFrom === "client" ? "Page View Client" : "Page View Server";

    // Deduplication check
    const dedupeKey = `dedupe:${properties.$device_id}:${properties.path}`;

    try {
      const result = await sharedRedis.set(dedupeKey, "1", {
        nx: true, // Only set if not exists
        ex: 2, // 2 second expiration
      });

      if (result !== "OK") {
        return NextResponse.json({ success: true, message: "Duplicate event skipped" }, { status: 200 });
      }
    } catch (redisError) {
      console.error("Redis dedupe failed:", redisError);
      // Continue tracking anyway to avoid losing data
    }

    // Enrich with server-side IP if missing
    if (!properties.ip) {
      properties.ip = getClientIp(request.headers);
    }

    // Only capture userAgent data for client requests
    // Middleware already includes this data for server requests
    let enrichedProperties = { ...properties };

    if (callFrom === "client") {
      // Only add userAgent data for client requests
      const { device, browser, os, isBot, ua } = userAgent(request);
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

      enrichedProperties = { ...enrichedProperties, ...userAgentData };
    }

    await mpServerTrack(eventName, enrichedProperties);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking page view:", error);

    return NextResponse.json({ success: false, error: "Failed to track page view" }, { status: 500 });
  }
}

// Ensure this runs in Node.js runtime
export const runtime = "nodejs";
