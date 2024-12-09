import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DB_RPC } from "@/lib/constants/apiRoutes";
import { SettingsResponse } from "@/app/api/(protected)/settings/route";

export type SettingsInsertJobResponse = Pick<
  SettingsResponse,
  "insert_default_countries" | "insert_default_job_categories" | "insert_default_experience_levels" | "all_countries" | "all_job_categories" | "all_experience_levels"
>;

export async function GET() {
  const { userId } = auth();

  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.rpc(DB_RPC.GET_USER_PREFERENCES_INSERT_JOB, {
    // userId will be null for unauthenticated users, as it is string | null
    p_user_id: userId,
  });

  if (error) {
    console.error("Error fetching user preferences and options insert job:", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
