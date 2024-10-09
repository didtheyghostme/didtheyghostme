export const DBTable = {
  COMPANY: "company",
  JOB_POSTING: "job_posting",
  APPLICATION: "application",
  // Add other table names here
} as const;

export type DBTableValues = (typeof DBTable)[keyof typeof DBTable];
