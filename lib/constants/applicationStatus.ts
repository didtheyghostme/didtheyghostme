type UppercaseToApplicationStatus = {
  [K in Uppercase<ApplicationStatus>]: ApplicationStatus;
};

export const APPLICATION_STATUS = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  REJECTED: "Rejected",
  HIRED: "Hired",
  GHOSTED: "Ghosted",
  OFFER: "Offer",
} as const satisfies UppercaseToApplicationStatus;
