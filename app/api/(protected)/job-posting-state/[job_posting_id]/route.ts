import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { jobPostingStateActionSchema, type JobPostingStateAction } from "@/lib/schema/jobPostingStateActionSchema";

export type GetJobPostingStateResponse = Pick<UserJobPostingStateTable, "job_posting_id" | "to_apply_at" | "skipped_at" | "note" | "created_at" | "updated_at"> | null;

type JobPostingStateNote = Extract<JobPostingStateAction, { action: "set_note" }>["note"];

export async function GET(_request: NextRequest, { params }: { params: { job_posting_id: string } }) {
  const { userId } = auth();

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase
    .from(DBTable.USER_JOB_POSTING_STATE)
    .select("job_posting_id,to_apply_at,skipped_at,note,created_at,updated_at")
    .eq("user_id", userId)
    .eq("job_posting_id", params.job_posting_id)
    .maybeSingle()
    .overrideTypes<GetJobPostingStateResponse, { merge: false }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? null);
}

export async function PUT(request: NextRequest, { params }: { params: { job_posting_id: string } }) {
  const { userId } = auth();

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = jobPostingStateActionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const body = parsed.data;

  const supabase = await createClerkSupabaseClientSsr();

  const nowIso = new Date().toISOString();

  type UpsertUserJobPostingStatePatch = Pick<InsertUserJobPostingState, "user_id" | "job_posting_id"> & {
    to_apply_at?: string | null;
    skipped_at?: string | null;
    note?: string | null;
  };

  const base = { user_id: userId, job_posting_id: params.job_posting_id } satisfies Pick<InsertUserJobPostingState, "user_id" | "job_posting_id">;

  const handlers = {
    set_to_apply: () => ({ ...base, to_apply_at: nowIso, skipped_at: null }),
    clear_to_apply: () => ({ ...base, to_apply_at: null }),
    set_skipped: () => ({ ...base, skipped_at: nowIso, to_apply_at: null }),
    clear_skipped: () => ({ ...base, skipped_at: null }),
    set_note: (note: JobPostingStateNote) => ({ ...base, note }),
  } as const;

  const upsertData: UpsertUserJobPostingStatePatch = body.action === "set_note" ? handlers.set_note(body.note) : handlers[body.action]();

  const { data, error } = await supabase
    .from(DBTable.USER_JOB_POSTING_STATE)
    .upsert(upsertData, { onConflict: "user_id,job_posting_id" })
    .select("job_posting_id,to_apply_at,skipped_at,note,created_at,updated_at")
    .single()
    .overrideTypes<GetJobPostingStateResponse, { merge: false }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
