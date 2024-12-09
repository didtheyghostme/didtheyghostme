import { NextRequest, NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { AllJobsPageData } from "@/app/jobs/AllJobSearchResult";
import { DB_RPC } from "@/lib/constants/apiRoutes";

export type AllJobsPageResponse = {
  data: AllJobsPageData[];
  totalPages: number;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const search = searchParams.get("search") ?? "";
  const isVerified = searchParams.get("isVerified") === "true";
  const sortOrder = (searchParams.get("sortOrder") ?? "DESC") as "ASC" | "DESC";

  // Fix: Split any comma-separated values into separate array elements
  const countriesParam = searchParams.get("countries");
  const countries = countriesParam ? countriesParam.split(",").filter(Boolean) : null;

  const experienceLevelIdsParam = searchParams.get("experienceLevelIds");
  const experienceLevelIds = experienceLevelIdsParam ? experienceLevelIdsParam.split(",").filter(Boolean) : null;

  const jobCategoryIdsParam = searchParams.get("jobCategoryIds");
  const jobCategoryIds = jobCategoryIdsParam ? jobCategoryIdsParam.split(",").filter(Boolean) : null;

  // console.warn("countries=", countries);
  // console.warn("experienceLevelIds=", experienceLevelIds);
  // console.warn("jobCategoryIds=", jobCategoryIds);

  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.rpc(DB_RPC.GET_ALL_SEARCH_JOBS, {
    p_page: page,
    p_search: search,
    p_is_verified: isVerified,
    p_country_names: countries,
    p_sort_order: sortOrder,
    p_experience_level_names: experienceLevelIds,
    p_job_category_names: jobCategoryIds,
  });

  if (error) {
    console.error("error. searching jobs", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
