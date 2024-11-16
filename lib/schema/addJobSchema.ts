import { z } from "zod";

export const addJobSchema = z.object({
  title: z.string().min(1, "Job title is required").max(100, "Job title must be less than 100 characters"),
  url: z.string().url("Invalid URL").nullable(),
  countries: z.array(z.string()).min(1, "At least one country is required"),
}) satisfies z.ZodType<Pick<JobPostingTable, "title" | "url"> & { countries: string[] }>;

export type AddJobFormData = z.infer<typeof addJobSchema>;
