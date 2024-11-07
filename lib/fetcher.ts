import mixpanel from "mixpanel-browser";

import { RateLimitError, ERROR_MESSAGES } from "./errorHandling";

export const fetcher = async <T = any>(resource: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(resource, init);

  if (!response.ok) {
    if (response.status === 429) {
      mixpanel.track("Rate limit violation", {
        distinct_id: mixpanel.get_distinct_id(),
        url: resource.toString(),
        type: "fetcher client track",
        method: init?.method || "GET",
        status: response.status,
      });

      throw new Error(ERROR_MESSAGES.TOO_MANY_REQUESTS) as RateLimitError;
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: T = await response.json();

  return data;
};
