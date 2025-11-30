"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import mixpanel from "mixpanel-browser";
import { useUser } from "@clerk/nextjs";

import { MIXPANEL_COOKIE_NAME } from "@/lib/constants/mixpanelCookie";
import { setCookieAction } from "@/app/actions/setCookieAction";
import { getCookieAction } from "@/app/actions/getCookieAction";
import { API } from "@/lib/constants/apiRoutes";
import { trackPageViewAction } from "@/app/actions/trackPageViewAction";

type MixpanelProviderProps = {
  children: ReactNode;
};

export function MixpanelProvider({ children }: MixpanelProviderProps) {
  const pathname = usePathname();

  const { user, isLoaded } = useUser();

  // Initialize Mixpanel
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!;

    mixpanel.init(token, {
      debug: process.env.NODE_ENV === "development",
      track_pageview: "url-with-path",
      persistence: "localStorage",
      record_sessions_percent: Number(process.env.NEXT_PUBLIC_MIXPANEL_RECORD_SESSIONS_PERCENT ?? 1),
      record_heatmap_data: true,
      ignore_dnt: true,
      api_host: process.env.NEXT_PUBLIC_MIXPANEL_API_HOST,
    });
  }, []);

  // Set Super Property for isSignedIn
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const isSignedIn = !!user;

    const currentIsSignedIn = mixpanel.get_property("is_signed_in");

    if (isSignedIn !== currentIsSignedIn) {
      mixpanel.register({
        is_signed_in: isSignedIn, // true if user is signed in, false otherwise
      });
    }
  }, [isLoaded, user]);

  // Identify user when they log in
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const handleUserIdentification = async () => {
      const currentDistinctId = mixpanel.get_distinct_id();

      const deviceId = mixpanel.get_property("$device_id");

      const existingCookieDeviceId = await getCookieAction(MIXPANEL_COOKIE_NAME);

      if (user) {
        // User is logged in
        if (currentDistinctId !== user.id) {
          // Set the user ID as distinct_id for all events after login
          mixpanel.identify(user.id);

          mixpanel.track("User Identified", {
            $user_id: user.id,
            $device_id: deviceId,
          });

          // Set the cookie to the device ID once
          await setCookieAction(MIXPANEL_COOKIE_NAME, deviceId);
        }
      } else {
        // User is logged out

        // Only reset if we're transitioning from logged in to logged out
        // Not on initial load or browser refresh
        const wasLoggedIn = typeof currentDistinctId === "string" && currentDistinctId.startsWith("user_");

        if (wasLoggedIn) {
          mixpanel.reset();

          // After reset, get the new device ID and update the cookie
          const newDeviceId = mixpanel.get_property("$device_id");

          await setCookieAction(MIXPANEL_COOKIE_NAME, newDeviceId);
        } else {
          // Anonymous user: ALWAYS sync cookie with Mixpanel's device ID
          if (existingCookieDeviceId !== deviceId) {
            await setCookieAction(MIXPANEL_COOKIE_NAME, deviceId);
          }
        }
      }
    };

    // Execute the async function
    handleUserIdentification().catch((error) => {
      console.error("Error in Mixpanel identification process:", error);
    });
  }, [isLoaded, user]);

  // TODO: (experimenting) decide if we want to track page views from here or in middleware
  // Track page views
  useEffect(() => {
    if (!pathname || !isLoaded) {
      return;
    }

    // mixpanel.track("Page View", { path: pathname });

    const trackPageView = async () => {
      const url = new URL(window.location.href);
      const utmParams = Object.fromEntries(Array.from(url.searchParams.entries()).filter(([key]) => key.startsWith("utm_")));

      // Get device ID from mixpanel client
      const deviceId = mixpanel.get_property("$device_id") ?? "unknownDeviceId";

      const cookieDeviceId = (await getCookieAction(MIXPANEL_COOKIE_NAME)) ?? "noCookieDeviceId";

      const device_id_status =
        deviceId === cookieDeviceId ? "synced" : deviceId === "unknownDeviceId" ? "missing_mixpanel_device_id" : cookieDeviceId === "noCookieDeviceId" ? "missing_cookie" : "mismatch_cookie";

      // 1) Track page view using server action
      trackPageViewAction({
        path: pathname,
        $current_url: url.href,
        client_device_id: deviceId,
        cookie_device_id: cookieDeviceId,
        device_id_status,
        ...(deviceId !== "unknownDeviceId" ? { $device_id: deviceId } : {}),
        ...(user ? { user_id: user.id } : {}),
        ...utmParams,
      }).catch((error) => {
        console.error("Failed to track page view server action:", error);
      });

      // 2) Track page view using fetch, Add timestamp to prevent browser caching (cache busting)
      fetch(`${API.MIXPANEL_TRACK.pageView}?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          $current_url: url.href,
          callFrom: "client",
          client_device_id: deviceId,
          cookie_device_id: cookieDeviceId,
          device_id_status,
          ...(deviceId !== "unknownDeviceId" ? { $device_id: deviceId } : {}),
          ...(user ? { user_id: user.id } : {}),
          ...utmParams,
        }),
      }).catch((error) => {
        console.error("Failed to track page view fetch:", error);
      });
    };

    trackPageView().catch((error) => {
      console.error("Failed to track page view general:", error);
    });
  }, [pathname, isLoaded, user]);

  return <>{children}</>;
}
