import Mixpanel from "mixpanel";

// Create singleton instance
const mixpanel = Mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
  debug: process.env.NODE_ENV === "development",
});

export { mixpanel };
