import { z } from "zod";

import { JOB_STATUS } from "@/lib/constants/jobPostingStatus";

export const updateJobPostingAdminSchema = z.object({
  title: z.string().min(1, "Job title is required").max(100, "Job title must be less than 100 characters"),
  country: z.string().min(1, "Country is required"),
  url: z.string().url("Invalid URL").nullable(),
  closed_date: z.string().nullable(),
  job_status: z.enum(Object.values(JOB_STATUS) as [string, ...string[]]),
  job_posted_date: z.string().nullable(),
});

export type UpdateJobPostingAdminFormValues = z.infer<typeof updateJobPostingAdminSchema>;
