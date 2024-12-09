import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DB_RPC } from "@/lib/constants/apiRoutes";

export type SettingsResponse = {
  default_countries: string[];
  default_job_categories: JobCategoryName[];
  default_experience_levels: ExperienceLevel[];

  insert_default_countries: string[];
  insert_default_job_categories: JobCategoryName[];
  insert_default_experience_levels: ExperienceLevel[];

  available_countries: string[];
  all_countries: string[];
  all_job_categories: JobCategoryName[];
  all_experience_levels: ExperienceLevel[];
};

export async function GET() {
  const { userId } = auth();

  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.rpc(DB_RPC.GET_USER_PREFERENCES_SETTINGS, {
    // userId will be null for unauthenticated users, as it is string | null
    p_user_id: userId,
  });

  if (error) {
    console.error("Error fetching user preferences and options settings page:", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
