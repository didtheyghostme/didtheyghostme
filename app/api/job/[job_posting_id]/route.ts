import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DB_TABLE } from "@/lib/constants/dbTables";

// TODO: on this job specific page, select all the applications for this job

export async function GET(request: Request, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();
  const { data, error } = await supabase
    .from(DB_TABLE.JOB_POSTING)
    .select(
      `
    id,
    title,
    country,
    url,
    ${DB_TABLE.COMPANY}:company_id (
      id,
      company_name
    )
  `,
    )
    .eq("id", params.job_posting_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  console.warn("data in route handler of this job", data);

  return NextResponse.json(data);
}
