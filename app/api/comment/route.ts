import { NextRequest, NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { DB_RPC } from "@/lib/constants/apiRoutes";

export type QuestionWithReplyCountResponse = CommentTable & {
  reply_count: number;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const entity_type = searchParams.get("entity_type") as CommentEntityType;
  const entity_id = searchParams.get("entity_id");

  console.log("entity_type", entity_type, "entity_id", entity_id);

  if (!entity_type || !entity_id) {
    return NextResponse.json({ error: "Missing entity_type or entity_id" }, { status: 400 });
  }

  const supabase = await createClerkSupabaseClientSsr();

  if (entity_type === DBTable.JOB_POSTING) {
    // For job postings, fetch questions with reply counts
    const { data, error } = await supabase.rpc(DB_RPC.GET_QUESTIONS_WITH_REPLY_COUNTS, { job_posting_id: entity_id });

    console.log("data", data, "error", error);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } else {
    // For questions or interview experiences, fetch comments without counts
    const { data, error } = await supabase.from(DBTable.COMMENT).select("*").eq("entity_type", entity_type).eq("entity_id", entity_id).order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }
}
