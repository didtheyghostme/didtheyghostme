import { NextRequest, NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";
import { AllJobsPageData } from "@/app/jobs/AllJobSearchResult";

export type AllJobsPageResponse = {
  data: AllJobsPageData[];
  totalPages: number;
};

const LIMIT_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const search = searchParams.get("search") ?? "";

  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<AllJobsPageData> = {
    id: true,
    title: true,
    country: true,
    [DBTable.COMPANY]: {
      company_name: true,
    },
  };
  const selectString = buildSelectString(selectObject);

  let query = supabase.from(DBTable.JOB_POSTING).select(selectString, { count: "exact" });

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  const { data, error, count } = await query.range((page - 1) * LIMIT_PER_PAGE, page * LIMIT_PER_PAGE - 1).order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    totalPages: Math.ceil((count ?? 0) / LIMIT_PER_PAGE),
  });
}
