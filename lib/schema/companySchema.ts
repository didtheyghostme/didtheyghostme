import { z } from "zod";

export const companySchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_url: z.string().url("Invalid URL").min(1, "Company URL is required"),
}) satisfies z.ZodType<Company>;

export type CompanyFormData = z.infer<typeof companySchema>;
