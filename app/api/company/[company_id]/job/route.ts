import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString } from "@/lib/buildSelectString";
import { SelectObject } from "@/lib/buildSelectString";
import { CompanyDetailsPageAllJobsResponse } from "@/app/company/[company_id]/page";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/errorHandling";

// Select all the jobs from job_posting table for a company on the specific company page

export async function GET(request: Request, { params }: { params: { company_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<CompanyDetailsPageAllJobsResponse> = {
    id: true,
    title: true,
    job_status: true,
    updated_at: true,
    job_posted_date: true,
  };

  let selectString = buildSelectString(selectObject);

  const { data, error } = await supabase
    .from(DBTable.JOB_POSTING)
    .select(selectString)
    .eq("company_id", params.company_id)
    .order("job_posted_date", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) {
    if (error.code === ERROR_CODES.INVALID_TEXT_REPRESENTATION) {
      return NextResponse.json({ error: ERROR_MESSAGES.NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
