export const JOB_STATUS = {
  Pending: "Pending",
  Verified: "Verified",
  Closed: "Closed",
  Rejected: "Rejected",
  "No URL": "No URL",
} as const satisfies Record<JobStatus, JobStatus>;
