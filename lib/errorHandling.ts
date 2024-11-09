export class APINotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "APINotFoundError";
  }
}

export const ERROR_CODES = {
  UNIQUE_VIOLATION: "23505",
  INVALID_TEXT_REPRESENTATION: "22P02",
};

export const ERROR_MESSAGES = {
  NOT_FOUND: "Not found",
  DUPLICATE_URL: "A company with this URL already exists.",
  DUPLICATE_NAME: "A company with this name already exists.",
  // Add other error messages here
  TOO_MANY_REQUESTS: "Too many requests. Please try again later.",
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;

  return String(error);
};

export const isDuplicateUrlError = (error: unknown): boolean => {
  return getErrorMessage(error) === ERROR_MESSAGES.DUPLICATE_URL;
};

export const isDuplicateNameError = (error: unknown): boolean => {
  return getErrorMessage(error) === ERROR_MESSAGES.DUPLICATE_NAME;
};

type LimiterType = "primary" | "fallback";

export type RateLimitErrorResponse = {
  error: typeof ERROR_MESSAGES.TOO_MANY_REQUESTS; // string
  limiterType: LimiterType;
};

export type RateLimitError = Error;

// Add a type guard function
export const isRateLimitError = (error: unknown): error is RateLimitError => {
  return error instanceof Error && error.message === ERROR_MESSAGES.TOO_MANY_REQUESTS;
};

// reusable function to create a rate limit response
export const createRateLimitResponse = (limiterType: LimiterType): RateLimitErrorResponse => {
  return {
    error: ERROR_MESSAGES.TOO_MANY_REQUESTS,
    limiterType,
  };
};
