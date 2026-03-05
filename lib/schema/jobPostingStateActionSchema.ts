import type { Expect } from "@/lib/sharedTypes";

import { z } from "zod";

const jobPostingStateNoteSchema = z.preprocess((val) => {
  if (typeof val !== "string") return val;

  const s = val.trim();

  return s === "" ? null : s;
}, z.string().nullable());

type JobPostingStateNote = z.infer<typeof jobPostingStateNoteSchema>;

export const jobPostingStateActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_to_apply") }),
  z.object({ action: z.literal("clear_to_apply") }),
  z.object({ action: z.literal("set_skipped") }),
  z.object({ action: z.literal("clear_skipped") }),
  z.object({ action: z.literal("set_note"), note: jobPostingStateNoteSchema }),
]);

export type JobPostingStateAction = z.infer<typeof jobPostingStateActionSchema>;

type BasePatch = Pick<InsertUserJobPostingState, "user_id" | "job_posting_id">;

type PatchByAction = {
  set_to_apply: BasePatch & { to_apply_at: string; skipped_at: null };
  clear_to_apply: BasePatch & { to_apply_at: null };
  set_skipped: BasePatch & { skipped_at: string; to_apply_at: null };
  clear_skipped: BasePatch & { skipped_at: null };
  set_note: BasePatch & { note: JobPostingStateNote };
};

type ExactKeyUnion<A, B> = [Exclude<A, B>, Exclude<B, A>] extends [never, never] ? true : ["Key mismatch", { extra: Exclude<A, B> }, { missing: Exclude<B, A> }];

/* eslint-disable @typescript-eslint/no-unused-vars */
type _ExactPatchByActionKeys = Expect<ExactKeyUnion<keyof PatchByAction, JobPostingStateAction["action"]>>;
/* eslint-enable @typescript-eslint/no-unused-vars */

type UpsertUserJobPostingStatePatch = PatchByAction[JobPostingStateAction["action"]];

export function buildUpsertPatch({ body, userId, jobPostingId, nowIso }: { body: JobPostingStateAction; userId: string; jobPostingId: string; nowIso: string }): UpsertUserJobPostingStatePatch {
  const base = { user_id: userId, job_posting_id: jobPostingId } satisfies BasePatch;

  switch (body.action) {
    case "set_to_apply":
      return { ...base, to_apply_at: nowIso, skipped_at: null };
    case "clear_to_apply":
      return { ...base, to_apply_at: null };
    case "set_skipped":
      return { ...base, skipped_at: nowIso, to_apply_at: null };
    case "clear_skipped":
      return { ...base, skipped_at: null };
    case "set_note":
      return { ...base, note: body.note };
  }
}
