import Mixpanel from "mixpanel";
import { cookies } from "next/headers";

import { MIXPANEL_COOKIE_NAME } from "@/lib/constants/mixpanelCookie";
import { setCookieAction } from "@/app/actions/setCookieAction";

// Create singleton instance
const mp = Mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
  debug: process.env.NODE_ENV === "development",
});

/**
 * Track an event in Mixpanel with proper anonymous and user ID handling
 */
export async function mpServerTrack(eventName: string, properties: Record<string, any> = {}, isWebhook = false) {
  try {
    // Skip cookie handling for webhooks
    if (!isWebhook) {
      const cookieStore = await cookies();

      let deviceId = cookieStore.get(MIXPANEL_COOKIE_NAME)?.value;

      if (!deviceId) {
        deviceId = crypto.randomUUID();
        await setCookieAction(MIXPANEL_COOKIE_NAME, deviceId);
      }

      // Set device ID for all events
      properties.$device_id = deviceId;
    }

    // Handle user ID if provided
    if (properties.user_id) {
      properties.$user_id = properties.user_id;
      delete properties.user_id;
    }

    // Properly promisify the callback-based track method
    await new Promise<void>((resolve, reject) => {
      mp.track(eventName, properties, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    return true;
  } catch (error) {
    // Log but don't throw so analytics errors don't break app functionality
    const safeProperties = { ...properties };

    if (safeProperties.$device_id) safeProperties.$device_id = "(redacted)";
    if (safeProperties.$user_id) safeProperties.$user_id = "(redacted)";

    console.error(`Error tracking Mixpanel event "${eventName}":`, {
      error,
      properties: safeProperties,
    });

    return false;
  }
}

export { mp };
