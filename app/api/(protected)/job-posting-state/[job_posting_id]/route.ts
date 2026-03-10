import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DB_RPC } from "@/lib/constants/apiRoutes";
import { DBTable } from "@/lib/constants/dbTables";
import { ERROR_CODES, ERROR_DETAILS, ERROR_MESSAGES } from "@/lib/errorHandling";
import { jobPostingStateActionSchema } from "@/lib/schema/jobPostingStateActionSchema";

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
  const { data, error } = await supabase.rpc(DB_RPC.SET_JOB_POSTING_STATE, {
    p_user_id: userId,
    p_job_posting_id: params.job_posting_id,
    p_action: body.action,
    p_note: "note" in body ? body.note : null,
  });

  if (error?.code === ERROR_CODES.RAISE_EXCEPTION) {
    if (error.details === ERROR_DETAILS.TRACKED_JOB_STATE_CONFLICT) {
      return NextResponse.json({ error: ERROR_MESSAGES.TRACKED_JOB_STATE_CONFLICT }, { status: 409 });
    }

    if (error.details === ERROR_DETAILS.INVALID_JOB_POSTING_STATE_ACTION) {
      console.error("Invalid job posting state action", {
        userId,
        jobPostingId: params.job_posting_id,
        action: body.action,
        rpcError: error,
      });
    }
  }

  if (error) {
    return NextResponse.json({ error: "Failed to update job posting state" }, { status: 500 });
  }

  return NextResponse.json((data ?? null) as GetJobPostingStateResponse);
}
