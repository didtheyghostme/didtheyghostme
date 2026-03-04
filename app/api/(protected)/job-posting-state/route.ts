import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";

type JobPostingStateListKind = "to_apply" | "skipped" | "notes";

type JobPostingStateListItem = Pick<UserJobPostingStateTable, "job_posting_id" | "to_apply_at" | "skipped_at" | "note" | "created_at" | "updated_at"> & {
  [DBTable.JOB_POSTING]: Pick<JobPostingTable, "id" | "title"> & {
    [DBTable.COMPANY]: Pick<CompanyTable, "id" | "company_name" | "logo_url">;
  };
};

export async function GET(request: NextRequest) {
  const { userId } = auth();

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kind = request.nextUrl.searchParams.get("kind") as JobPostingStateListKind | null;

  if (!kind || !["to_apply", "skipped", "notes"].includes(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<JobPostingStateListItem> = {
    job_posting_id: true,
    to_apply_at: true,
    skipped_at: true,
    note: true,
    created_at: true,
    updated_at: true,
    [DBTable.JOB_POSTING]: {
      id: true,
      title: true,
      [DBTable.COMPANY]: {
        id: true,
        company_name: true,
        logo_url: true,
      },
    },
  };

  const selectString = buildSelectString(selectObject);

  let query = supabase.from(DBTable.USER_JOB_POSTING_STATE).select(selectString).eq("user_id", userId).overrideTypes<JobPostingStateListItem[], { merge: false }>();

  if (kind === "to_apply") query = query.not("to_apply_at", "is", null).is("skipped_at", null);
  if (kind === "skipped") query = query.not("skipped_at", "is", null);
  if (kind === "notes") query = query.not("note", "is", null);

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
