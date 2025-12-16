"use server";

import { headers } from "next/headers";
import { userAgent } from "next/server";

import { mpServerTrack } from "@/lib/mixpanelServer";
import { getClientIp } from "@/lib/getClientIp";

// Define a type for the data parameter
type PageViewData = {
  path: string;
  $current_url: string;
  user_id?: string;
  $device_id?: string;
  // Allow for UTM parameters and other dynamic properties
  [key: string]: any;
};

export async function trackPageViewAction(data: PageViewData) {
  const headersList = headers();
  const ip = getClientIp(headersList);

  // Get user agent from the header
  const userAgentString = headersList.get("user-agent") || "";
  const { device, browser, os, isBot } = userAgent({ headers: headersList });

  const userAgentData = {
    $browser: browser.name,
    $browser_version: browser.version,
    $os: os.name,
    $os_version: os.version,
    $device: device.vendor,
    $model: device.model,
    userAgent: userAgentString,
    isBot,
  };

  return await mpServerTrack("Page View Client Server Action", {
    ip,
    ...data,
    ...userAgentData,
  });
}
