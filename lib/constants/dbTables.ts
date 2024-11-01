export const DBTable = {
  COMPANY: "company",
  JOB_POSTING: "job_posting",
  APPLICATION: "application",
  INTERVIEW_EXPERIENCE: "interview_experience",
  USER_DATA: "user_data",
  COMMENT: "comment",
  REPORT_ADMIN: "report_admin",
  INTERVIEW_TAG: "interview_tag",
  INTERVIEW_TAG_MAPPING: "interview_tag_mapping",
  // Add other table names here
} as const;

export type DBTableValues = (typeof DBTable)[keyof typeof DBTable];
