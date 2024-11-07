import { RateLimitError, ERROR_MESSAGES } from "./errorHandling";

export const fetcher = async <T = any>(resource: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(resource, init);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(ERROR_MESSAGES.TOO_MANY_REQUESTS) as RateLimitError;
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: T = await response.json();

  return data;
};
