import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";

// TODO: on this job specific page, select all the applications for this job

export async function GET(request: Request, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();
  // TODO: generate supabase type gen link to supabaseclient
  const { data, error } = await supabase
    .from(DBTable.JOB_POSTING)
    .select(
      `
    id,
    title,
    country,
    url,
    ${DBTable.COMPANY}:company_id (
      id,
      company_name
    )
  `,
    )
    .eq("id", params.job_posting_id)
    .single();

  console.error("data in route handler of this joaab", data, error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  console.warn("data in route handler of this job", data);

  return NextResponse.json(data);
}
