"use client";

import { ReactNode, useEffect } from "react";
// import { usePathname } from "next/navigation";
import mixpanel from "mixpanel-browser";
import { useUser } from "@clerk/nextjs";

type MixpanelProviderProps = {
  children: ReactNode;
};

export function MixpanelProvider({ children }: MixpanelProviderProps) {
  //   const pathname = usePathname();

  const { user, isLoaded } = useUser();

  // Initialize Mixpanel
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!;

    mixpanel.init(token, {
      debug: process.env.NODE_ENV === "development",
      track_pageview: "url-with-path",
      persistence: "localStorage",
    });
  }, []);

  // Set Super Property for isSignedIn
  useEffect(() => {
    if (isLoaded) {
      const isSignedIn = !!user;

      const currentIsSignedIn = mixpanel.get_property("is_signed_in");

      if (isSignedIn !== currentIsSignedIn) {
        mixpanel.register({
          is_signed_in: isSignedIn, // true if user is signed in, false otherwise
        });
      }
    }
  }, [isLoaded, user]);

  // Identify user when they log in
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      mixpanel.identify(user.id);
      mixpanel.people.set({
        $email: user.primaryEmailAddress?.emailAddress,
        $github: user.externalAccounts.find((account) => account.provider === "github")?.username,
        $name: user.fullName,
        $avatar: user.imageUrl,
        $created: user.createdAt,
        clerk_id: user.id,
      });
    } else {
      // Only reset if we're transitioning from logged in to logged out
      // Not on initial load or browser refresh
      const currentDistinctId = mixpanel.get_distinct_id();
      const wasLoggedIn = typeof currentDistinctId === "string" && currentDistinctId.startsWith("user_");

      if (wasLoggedIn) {
        mixpanel.reset();
      }
    }
  }, [isLoaded, user]);

  // Track page views
  //   useEffect(() => {
  //     if (pathname) {
  //       mixpanel.track("Page View", { path: pathname });
  //     }
  //   }, [pathname]);

  return <>{children}</>;
}
