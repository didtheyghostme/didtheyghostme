import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";

export type GetJobPostingStateResponse = Pick<UserJobPostingStateTable, "job_posting_id" | "to_apply_at" | "skipped_at" | "note" | "created_at" | "updated_at"> | null;

type PutJobPostingStateBody = {
  to_apply_at?: string | null;
  skipped_at?: string | null;
  note?: string | null;
};

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

  const body = (await request.json()) as PutJobPostingStateBody;

  const to_apply_at = "to_apply_at" in body ? body.to_apply_at : undefined;
  const skipped_at = "skipped_at" in body ? body.skipped_at : undefined;
  const note = "note" in body ? body.note : undefined;

  const supabase = await createClerkSupabaseClientSsr();

  const upsertData: Partial<InsertUserJobPostingState> & Pick<InsertUserJobPostingState, "user_id" | "job_posting_id"> = {
    user_id: userId,
    job_posting_id: params.job_posting_id,
  };

  if (to_apply_at !== undefined) upsertData.to_apply_at = to_apply_at;
  if (skipped_at !== undefined) upsertData.skipped_at = skipped_at;
  if (note !== undefined) upsertData.note = note;

  const { data, error } = await supabase
    .from(DBTable.USER_JOB_POSTING_STATE)
    .upsert(upsertData, { onConflict: "user_id,job_posting_id" })
    .select("job_posting_id,to_apply_at,skipped_at,note,created_at,updated_at")
    .single()
    .overrideTypes<GetJobPostingStateResponse, { merge: false }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
