import { z } from "zod";

export const companySchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(100, "Company name must be less than 100 characters").trim(),
  company_url: z.string().url("Invalid URL").min(1, "Company URL is required"),
}) satisfies z.ZodType<Pick<CompanyTable, "company_name" | "company_url">>;

export type CompanyFormData = z.infer<typeof companySchema>;
