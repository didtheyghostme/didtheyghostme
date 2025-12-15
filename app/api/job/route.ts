import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createLoader } from "nuqs/server";

import { nuqsJobSearchParamSchema } from "@/lib/schema/nuqsJobSearchParamSchema";
import { filterValidExperienceLevels, filterValidJobCategories } from "@/lib/nuqsJobSearchParamFilter";
import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { AllJobsPageData } from "@/app/jobs/AllJobSearchResult";
import { DB_RPC } from "@/lib/constants/apiRoutes";
import { mpServerTrack } from "@/lib/mixpanelServer";

const loadJobSearchParams = createLoader(nuqsJobSearchParamSchema);

export type AllJobsPageResponse = {
  data: AllJobsPageData[];
  totalPages: number;
};

export async function GET(request: NextRequest) {
  const { userId } = auth();

  // Parse search params from the request
  const { page, search, isVerified, countries, sortOrder, experienceLevelNames, jobCategoryNames } = await loadJobSearchParams(request);

  const filteredExperienceLevelNames = filterValidExperienceLevels(experienceLevelNames);
  const filteredJobCategoryNames = filterValidJobCategories(jobCategoryNames);

  if (filteredExperienceLevelNames.length !== experienceLevelNames.length) {
    mpServerTrack("All Jobs Filter Invalid", {
      filter_type: "experience_level",
      raw_values: experienceLevelNames,
      filtered_values: filteredExperienceLevelNames,
    });
  }

  if (filteredJobCategoryNames.length !== jobCategoryNames.length) {
    mpServerTrack("All Jobs Filter Invalid", {
      filter_type: "job_category",
      raw_values: jobCategoryNames,
      filtered_values: filteredJobCategoryNames,
    });
  }

  // console.warn("countries=", countries);
  // console.warn("experienceLevelNames=", experienceLevelNames);
  // console.warn("jobCategoryNames=", jobCategoryNames);

  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.rpc(DB_RPC.GET_ALL_SEARCH_JOBS, {
    p_page: page,
    p_search: search.trim(),
    p_is_verified: isVerified,
    // NOTE: countries null SQL fallback to user prefs -> defaults; non-empty invalid values currently 0 results (no fallback), if want to fallback need to edit sql
    p_country_names: countries.length > 0 ? countries : null,
    p_experience_level_names: filteredExperienceLevelNames.length > 0 ? filteredExperienceLevelNames : null,
    p_job_category_names: filteredJobCategoryNames.length > 0 ? filteredJobCategoryNames : null,
    p_sort_order: sortOrder,
    p_user_id: userId,
  });

  if (error) {
    console.error("error. searching jobs", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
