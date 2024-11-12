import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { SelectObject } from "@/lib/buildSelectString";
import { buildSelectString } from "@/lib/buildSelectString";

export type AllJobPostingWithCompany = JobPostingTable & {
  [DBTable.COMPANY]: Pick<CompanyTable, "id" | "company_name" | "logo_url">;
};

export async function GET() {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<AllJobPostingWithCompany> = {
    id: true,
    title: true,
    created_at: true,
    updated_at: true,
    job_status: true,
    country: true,
    url: true,
    closed_date: true,
    company_id: true,
    job_posted_date: true,
    user_id: true,
    [DBTable.COMPANY]: {
      id: true,
      company_name: true,
      logo_url: true,
    },
  };

  const selectString = buildSelectString(selectObject);

  const { data: jobs, error } = await supabase.from(DBTable.JOB_POSTING).select(selectString).order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching jobs:", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(jobs);
}
