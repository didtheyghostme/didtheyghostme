type UppercaseToApplicationStatus = {
  [K in Uppercase<ApplicationStatus>]: ApplicationStatus;
};

export const APPLICATION_STATUS = {
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
  OFFERED: "Offered",
} as const satisfies UppercaseToApplicationStatus;
