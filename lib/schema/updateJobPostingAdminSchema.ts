import { z } from "zod";

import { JOB_STATUS } from "@/lib/constants/jobPostingStatus";

export const updateJobPostingAdminSchema = z.object({
  title: z.string().min(1, "Job title is required").max(100, "Job title must be less than 100 characters"),
  url: z.string().url("Invalid URL").nullable(),
  job_url_linkedin: z.string().url("Invalid LinkedIn URL").nullable(),
  countries: z.array(z.string()).min(1, "At least one country is required"),
  closed_date: z.string().nullable(),
  job_status: z.enum(Object.values(JOB_STATUS) as [string, ...string[]]),
  job_posted_date: z.string().nullable(),
  experience_level_ids: z.array(z.string()).min(1, "At least one experience level is required"),
  job_category_ids: z.array(z.string()).min(1, "At least one job category is required"),
});

export type UpdateJobPostingAdminFormValues = z.infer<typeof updateJobPostingAdminSchema>;
