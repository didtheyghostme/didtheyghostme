import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";

export async function GET(request: Request, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();
  const { data: changelog, error } = await supabase.from("job_posting_changelog").select("*").eq("job_posting_id", params.job_posting_id).order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(changelog);
}
