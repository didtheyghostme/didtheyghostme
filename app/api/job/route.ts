import { NextRequest, NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";
import { AllJobsPageData, AllJobsPageDataSelect } from "@/app/jobs/AllJobSearchResult";
import { JOB_STATUS } from "@/lib/constants/jobPostingStatus";

export type AllJobsPageResponse = {
  data: AllJobsPageData[];
  totalPages: number;
};

const LIMIT_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const search = searchParams.get("search") ?? "";
  const isVerified = searchParams.get("isVerified") === "true";

  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<AllJobsPageDataSelect> = {
    id: true,
    title: true,
    updated_at: true,
    job_posted_date: true,
    closed_date: true,
    [DBTable.COMPANY]: {
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
  // query filter closed_date jobs and url is not null, TODO: add job_status and use that to filter not "CLOSED"
  let query = supabase.from(DBTable.JOB_POSTING).select(selectString, { count: "exact" });

  if (isVerified) {
    query = query.eq("job_status", JOB_STATUS.Verified);
  } else {
    query = query.in("job_status", [JOB_STATUS.Pending, JOB_STATUS.Verified]);
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data, error, count } = await query.range((page - 1) * LIMIT_PER_PAGE, page * LIMIT_PER_PAGE - 1).order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // console.warn("data", data, "select", selectString);

  return NextResponse.json({
    data,
    totalPages: Math.ceil((count ?? 0) / LIMIT_PER_PAGE),
  });
}
