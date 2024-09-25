import { z } from "zod";

export const addJobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  country: z.string().min(1, "Country is required"),
  url: z.string().url("Invalid URL").nullable(),
}) satisfies z.ZodType<Pick<JobPosting, "title" | "country" | "url">>;

export type AddJobFormData = z.infer<typeof addJobSchema>;
