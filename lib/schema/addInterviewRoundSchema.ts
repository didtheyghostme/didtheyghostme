import { z } from "zod";

export const INTERVIEW_TAGS = ["Online Assessment", "HR Call", "Technical", "Behavioral", "Hiring Manager"] as const;

export const interviewRoundSchema = z.object({
  description: z.string().min(1, "Description is required"),
  interview_date: z.string().min(1, "Interview date is required"),
  response_date: z.string().nullable(),
  interview_tags: z.array(z.enum(INTERVIEW_TAGS)).nullable(),
}) satisfies z.ZodType<Pick<InterviewExperienceTable, "description" | "interview_date" | "response_date" | "interview_tags">>;

export type InterviewRoundSchema = z.infer<typeof interviewRoundSchema>;

// Helper type to find missing tags
type MissingTags = Exclude<InterviewTag, (typeof INTERVIEW_TAGS)[number]>;

// Type assertion with error message
type AssertAllInterviewTagsPresent = MissingTags extends never ? true : `Error: const INTERVIEW_TAGS is missing these tags: ${MissingTags}`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _assertAllInterviewTagsPresent: AssertAllInterviewTagsPresent = true;
