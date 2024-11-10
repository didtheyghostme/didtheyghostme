import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";

export async function GET() {
  const supabase = await createClerkSupabaseClientSsr();
  const { data: jobs, error } = await supabase.from("job_posting").select("*").order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching jobs:", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(jobs);
}
