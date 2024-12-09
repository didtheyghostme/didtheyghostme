import { z } from "zod";

export const addJobSchema = z.object({
  title: z.string().min(1, "Job title is required").max(100, "Job title must be less than 100 characters"),
  url: z.string().url("Invalid URL").nullable(),
  countries: z.array(z.string()).min(1, "At least one country is required"),
  experience_level_names: z.array(z.string()).min(1, "At least one experience level is required"),
  job_category_names: z.array(z.string()).min(1, "At least one job category is required"),
}) satisfies z.ZodType<
  Pick<JobPostingTable, "title" | "url"> & {
    countries: string[];
    experience_level_names: string[];
    job_category_names: string[];
  }
>;

export type AddJobFormData = z.infer<typeof addJobSchema>;
