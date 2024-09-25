import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";

// Select all the jobs from job_posting table for a company on the specific company page

export async function GET(request: Request, { params }: { params: { company_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();
  const { data, error } = await supabase.from("job_posting_v2").select().eq("company_id", params.company_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
