import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DB_RPC } from "@/lib/constants/apiRoutes";
import { SettingsResponse } from "@/app/api/(protected)/settings/route";

export type SettingsJobSearchResponse = Pick<
  SettingsResponse,
  "default_countries" | "default_job_categories" | "default_experience_levels" | "available_countries" | "all_job_categories" | "all_experience_levels"
>;

export async function GET() {
  const { userId } = auth();

  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.rpc(DB_RPC.GET_USER_PREFERENCES_JOB_SEARCH, {
    // userId will be null for unauthenticated users, as it is string | null
    p_user_id: userId,
  });

  if (error) {
    console.error("Error fetching user preferences and options job search:", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
