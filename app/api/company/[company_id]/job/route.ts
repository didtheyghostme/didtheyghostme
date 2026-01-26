import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString } from "@/lib/buildSelectString";
import { SelectObject } from "@/lib/buildSelectString";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/errorHandling";
import { JOB_STATUS } from "@/lib/constants/jobPostingStatus";

// Select all the jobs from job_posting table for a company on the specific company page

export type CompanyDetailsPageAllJobsResponse = Pick<JobPostingTable, "id" | "title" | "job_status" | "updated_at" | "job_posted_date" | "closed_date"> & JobPostingCountry;

export async function GET(request: Request, { params }: { params: { company_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<CompanyDetailsPageAllJobsResponse> = {
    id: true,
    title: true,
    job_status: true,
    updated_at: true,
    job_posted_date: true,
    closed_date: true,
    [DBTable.JOB_POSTING_COUNTRY]: {
      __isLeftJoin: true,
      [DBTable.COUNTRY]: {
        id: false,
        country_name: true,
      },
    },
  };

  let selectString = buildSelectString(selectObject);

  const { data, error } = await supabase
    .from(DBTable.JOB_POSTING)
    .select(selectString)
    .eq("company_id", params.company_id)
    .neq("job_status", JOB_STATUS.Rejected)
    .order("job_posted_date", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (error) {
    if (error.code === ERROR_CODES.INVALID_TEXT_REPRESENTATION) {
      return NextResponse.json({ error: ERROR_MESSAGES.NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
