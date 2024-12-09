import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { SelectObject } from "@/lib/buildSelectString";
import { buildSelectString } from "@/lib/buildSelectString";

type AllJobPostingWithCompanySelect = JobPostingTable & {
  [DBTable.COMPANY]: Pick<CompanyTable, "id" | "company_name" | "logo_url">;
} & JobPostingCountry &
  JobPostingExperienceLevel &
  JobPostingJobCategory;

export type AllJobPostingWithCompany = StrictOmit<AllJobPostingWithCompanySelect, "job_posting_country" | "job_posting_experience_level" | "job_posting_job_category"> &
  JobPostingCountryJoined &
  JobPostingExperienceLevelJoined &
  JobPostingJobCategoryJoined;

export async function GET() {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<AllJobPostingWithCompanySelect> = {
    id: true,
    title: true,
    created_at: true,
    updated_at: true,
    job_status: true,
    url: true,
    closed_date: true,
    company_id: true,
    job_posted_date: true,
    user_id: true,
    job_url_linkedin: true,
    [DBTable.COMPANY]: {
      id: true,
      company_name: true,
      logo_url: true,
    },
    [DBTable.JOB_POSTING_COUNTRY]: {
      __isLeftJoin: true,
      [DBTable.COUNTRY]: {
        id: true,
        country_name: true,
      },
    },
    [DBTable.JOB_POSTING_EXPERIENCE_LEVEL]: {
      __isLeftJoin: true,
      [DBTable.EXPERIENCE_LEVEL]: {
        id: true,
        experience_level: true,
      },
    },
    [DBTable.JOB_POSTING_JOB_CATEGORY]: {
      __isLeftJoin: true,
      [DBTable.JOB_CATEGORY]: {
        id: true,
        job_category_name: true,
      },
    },
  };

  const selectString = buildSelectString(selectObject);

  const { data: jobs, error } = await supabase.from(DBTable.JOB_POSTING).select(selectString).order("updated_at", { ascending: false });

  // console.warn("jobs admin", jobs);

  if (error) {
    console.error("Error fetching jobs:", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(jobs);
}
