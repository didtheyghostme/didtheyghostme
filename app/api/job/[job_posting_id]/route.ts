import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { SelectObject, buildSelectString } from "@/lib/buildSelectString";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/errorHandling";

// TODO: on this job specific page, select all the applications for this job

export type JobDetails = Pick<JobPostingTable, "id" | "title" | "url" | "job_status" | "updated_at" | "job_posted_date" | "closed_date"> & {
  [DBTable.COMPANY]: Pick<CompanyTable, "id" | "company_name" | "logo_url">;
} & JobPostingCountry;

export async function GET(request: Request, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<JobDetails> = {
    id: true,
    title: true,
    url: true,
    job_status: true,
    updated_at: true,
    job_posted_date: true,
    closed_date: true,
    [DBTable.COMPANY]: {
      id: true,
      company_name: true,
      logo_url: true,
    },
    [DBTable.JOB_POSTING_COUNTRY]: {
      __isLeftJoin: true,
      [DBTable.COUNTRY]: {
        id: false,
        country_name: true,
      },
    },
  };
  const selectString = buildSelectString(selectObject);

  const { data, error } = await supabase
    .from(DBTable.JOB_POSTING)
    .select(selectString)

    .eq("id", params.job_posting_id)
    .maybeSingle();

  // console.error("data in route handler of this joaab", data, error);

  if (error) {
    if (error.code === ERROR_CODES.INVALID_TEXT_REPRESENTATION) {
      return NextResponse.json({ error: ERROR_MESSAGES.NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // console.warn("data in route handler of this job", data);

  return NextResponse.json(data);
}
