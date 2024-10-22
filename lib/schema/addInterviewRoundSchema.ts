import { z } from "zod";
import { parseDate } from "@internationalized/date";

export const INTERVIEW_TAGS = ["Online Assessment", "HR Call", "Technical", "Behavioral", "Hiring Manager"] as const;

export const interviewRoundSchema = z.object({
  description: z.string().min(1, "Description is required"),
  interview_date: z.string().min(1, "Interview date is required"),
  response_date: z.string().nullable(),
  interview_tags: z.array(z.enum(INTERVIEW_TAGS)).nullable(),
});

export type InterviewRoundSchema = z.infer<typeof interviewRoundSchema>;

export const UpdateInterviewExperienceSchema = z
  .object({
    interviewRounds: z.array(interviewRoundSchema),
    first_response_date: z.string().min(1, "First response date is required"),
  })
  .superRefine((data, ctx) => {
    const { first_response_date, interviewRounds } = data;

    if (!interviewRounds || interviewRounds.length === 0) {
      return;
    }

    // Parse the first_response_date
    const firstResponseDate = parseDate(first_response_date);

    interviewRounds.forEach((round, index) => {
      const { interview_date, response_date } = round;

      const interviewDate = parseDate(interview_date);

      // Check if interview_date is after previous response_date or first_response_date
      if (index === 0) {
        if (interviewDate.compare(firstResponseDate) < 0) {
          ctx.addIssue({
            path: ["interviewRounds", index, "interview_date"],
            message: "Interview date must be after the first response date",
            code: z.ZodIssueCode.custom,
          });
        }
      } else {
        const previousRound = interviewRounds[index - 1];
        const previousResponseDate = previousRound.response_date ? parseDate(previousRound.response_date) : null;

        if (previousResponseDate && interviewDate.compare(previousResponseDate) < 0) {
          ctx.addIssue({
            path: ["interviewRounds", index, "interview_date"],
            message: "Interview date must be after the previous round's response date",
            code: z.ZodIssueCode.custom,
          });
        }
      }

      // Check if response_date is after interview_date
      if (response_date) {
        const respDate = parseDate(response_date);

        if (respDate.compare(interviewDate) < 0) {
          ctx.addIssue({
            path: ["interviewRounds", index, "response_date"],
            message: "Response date must be after the interview date",
            code: z.ZodIssueCode.custom,
          });
        }
      }
    });
  });

export type InterviewExperienceFormValues = z.infer<typeof UpdateInterviewExperienceSchema>;

export const INTERVIEW_FORM_ID = "interview-form";
