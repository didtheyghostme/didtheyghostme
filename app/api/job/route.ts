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

  const experienceLevelNamesParam = searchParams.get("experienceLevelNames");
  const experienceLevelNames = experienceLevelNamesParam ? experienceLevelNamesParam.split(",").filter(Boolean) : null;

  const jobCategoryNamesParam = searchParams.get("jobCategoryNames");
  const jobCategoryNames = jobCategoryNamesParam ? jobCategoryNamesParam.split(",").filter(Boolean) : null;

  // console.warn("countries=", countries);
  // console.warn("experienceLevelNames=", experienceLevelNames);
  // console.warn("jobCategoryNames=", jobCategoryNames);

  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.rpc(DB_RPC.GET_ALL_SEARCH_JOBS, {
    p_page: page,
    p_search: search,
    p_is_verified: isVerified,
    p_country_names: countries,
    p_sort_order: sortOrder,
    p_experience_level_names: experienceLevelNames,
    p_job_category_names: jobCategoryNames,
  });

  if (error) {
    console.error("error. searching jobs", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
