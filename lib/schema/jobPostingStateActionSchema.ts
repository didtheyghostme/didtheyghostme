import { z } from "zod";

export const jobPostingStateActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_to_apply") }),
  z.object({ action: z.literal("clear_to_apply") }),
  z.object({ action: z.literal("set_skipped") }),
  z.object({ action: z.literal("clear_skipped") }),
  z.object({ action: z.literal("set_note"), note: z.string().nullable() }),
]);

export type JobPostingStateAction = z.infer<typeof jobPostingStateActionSchema>;
