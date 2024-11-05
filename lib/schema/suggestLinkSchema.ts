import { z } from "zod";

export const suggestLinkSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
}) satisfies z.ZodType<Pick<JobPostingTable, "url">>;

export type SuggestLinkFormValues = z.infer<typeof suggestLinkSchema>;
