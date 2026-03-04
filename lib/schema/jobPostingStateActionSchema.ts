import { z } from "zod";

export const jobPostingStateNoteSchema = z.preprocess((val) => {
  if (typeof val !== "string") return val;

  const s = val.trim();

  return s === "" ? null : s;
}, z.string().nullable());

export type JobPostingStateNote = z.infer<typeof jobPostingStateNoteSchema>;

export const jobPostingStateActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_to_apply") }),
  z.object({ action: z.literal("clear_to_apply") }),
  z.object({ action: z.literal("set_skipped") }),
  z.object({ action: z.literal("clear_skipped") }),
  z.object({ action: z.literal("set_note"), note: jobPostingStateNoteSchema }),
]);

export type JobPostingStateAction = z.infer<typeof jobPostingStateActionSchema>;
