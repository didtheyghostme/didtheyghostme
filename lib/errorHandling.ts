export const ERROR_CODES = {
  UNIQUE_VIOLATION: "23505",
};

export const ERROR_MESSAGES = {
  DUPLICATE_URL: "A company with this URL already exists.",
  DUPLICATE_NAME: "A company with this name already exists.",
  // Add other error messages here
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
