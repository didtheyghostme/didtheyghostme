import { z } from "zod";

export const companySchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(100, "Company name must be less than 100 characters").trim(),
  company_url: z
    .string()
    .trim()
    .min(1, "Company URL is required")
    .url("Invalid URL")
    .refine((val) => {
      try {
        const u = new URL(val);

        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, "Company URL must be a valid website URL (http or https)"),
}) satisfies z.ZodType<Pick<CompanyTable, "company_name" | "company_url">>;

export type CompanyFormData = z.infer<typeof companySchema>;
