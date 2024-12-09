import { z } from "zod";

export const updateUserPreferenceSchema = z.object({
  default_countries: z.array(z.string()).min(1, "Select at least one country"),
  default_experience_levels: z.array(z.string()).min(1, "Select at least one experience level"),
  default_job_categories: z.array(z.string()).min(1, "Select at least one job category"),
}) satisfies z.ZodType<Record<UserPreferencesKey, string[]>>;

export type UpdateUserPreferenceFormValues = z.infer<typeof updateUserPreferenceSchema>;
