import { z } from "zod";

export const addJobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  country: z.string().min(1, "Country is required"),
}) satisfies z.ZodType<Pick<JobPosting, "title" | "country">>;

export type AddJobFormData = z.infer<typeof addJobSchema>;
