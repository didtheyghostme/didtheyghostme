import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildUpsertPatch, jobPostingStateActionSchema } from "@/lib/schema/jobPostingStateActionSchema";

export type GetJobPostingStateResponse = Pick<UserJobPostingStateTable, "job_posting_id" | "to_apply_at" | "skipped_at" | "note" | "created_at" | "updated_at"> | null;

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

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: { job_posting_id: string } }) {
  const { userId } = auth();

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = jobPostingStateActionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const body = parsed.data;

  const supabase = await createClerkSupabaseClientSsr();

  const nowIso = new Date().toISOString();

  const upsertData = buildUpsertPatch({ body, userId, jobPostingId: params.job_posting_id, nowIso });

  const { data, error } = await supabase
    .from(DBTable.USER_JOB_POSTING_STATE)
    .upsert(upsertData, { onConflict: "user_id,job_posting_id" })
    .select("job_posting_id,to_apply_at,skipped_at,note,created_at,updated_at")
    .single()
    .overrideTypes<GetJobPostingStateResponse, { merge: false }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
