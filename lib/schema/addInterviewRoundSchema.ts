import { z } from "zod";

export const interviewRoundSchema = z.object({
  id: z.string().optional(), // This is the optional database ID
  description: z.string().min(1, "Description is required"),
  response_date: z.string().nullable(),
}) satisfies z.ZodType<Pick<InterviewExperienceTable, "description" | "response_date">>;

export type InterviewRoundSchema = z.infer<typeof interviewRoundSchema>;
