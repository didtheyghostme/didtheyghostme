"use client";

import { Link } from "@nextui-org/react";
import mixpanel from "mixpanel-browser";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function RateLimitErrorMessage() {
  const pathname = usePathname();

  useEffect(() => {
    toast.error("Too many requests. Please try again later.", {
      duration: 5000,
    });
  }, []);

  const mixpanelTrackContactSupportClick = () => {
    mixpanel.track("Contact Support Clicked", {
      pathname: pathname,
      placement: "RateLimitErrorMessage",
    });
  };

  return (
    <div className="p-6 text-center">
      <p className="mt-4 text-lg font-semibold text-red-600">Too many requests</p>
      <p className="mt-2 text-gray-600">You have made too many requests too quickly. Please wait a while before trying again</p>
      <div className="mt-4 flex flex-col items-center gap-4">
        <Link showAnchorIcon className="text-primary hover:underline" href="/contact" onPress={mixpanelTrackContactSupportClick}>
          Contact Support
        </Link>
        <p className="text-xs text-default-400">If the issue persists, please contact support.</p>
      </div>
    </div>
  );
}
