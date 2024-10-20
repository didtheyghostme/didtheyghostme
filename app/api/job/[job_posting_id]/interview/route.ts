import { NextResponse, type NextRequest } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";

export async function GET(request: NextRequest, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  let query = supabase
    .from(DBTable.INTERVIEW_EXPERIENCE)
    .select(
      `
        *,
        ${DBTable.APPLICATION}!inner(*)
      `,
    )
    .eq(`${DBTable.APPLICATION}.job_posting_id`, params.job_posting_id);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
