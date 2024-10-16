import { z } from "zod";

export const interviewRoundSchema = z.object({
  description: z.string().min(1, "Description is required"),
  interview_date: z.string().min(1, "Interview date is required"),
  response_date: z.string().nullable(),
}) satisfies z.ZodType<Pick<InterviewExperienceTable, "description" | "interview_date" | "response_date">>;

export type InterviewRoundSchema = z.infer<typeof interviewRoundSchema>;
