import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { JobDetails } from "@/app/job/[job_posting_id]/page";
import { SelectObject, buildSelectString } from "@/lib/buildSelectString";

// TODO: on this job specific page, select all the applications for this job

export async function GET(request: Request, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<JobDetails> = {
    id: true,
    title: true,
    country: true,
    url: true,
    job_status: true,
    [DBTable.COMPANY]: {
      id: true,
      company_name: true,
      logo_url: true,
    },
  };
  const selectString = buildSelectString(selectObject);

  console.log("select query is ", selectString);

  const { data, error } = await supabase
    .from(DBTable.JOB_POSTING)
    .select(selectString)

    .eq("id", params.job_posting_id)
    .maybeSingle();

  // console.error("data in route handler of this joaab", data, error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // console.warn("data in route handler of this job", data);

  return NextResponse.json(data);
}
