import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";

// TODO: on this job specific page, select all the applications for this job

export async function GET(request: Request, { params }: { params: { job_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();
  const { data, error } = await supabase
    .from("job_posting_v2")
    .select(
      `
      id,
      title,
      country,
      url,
      company:company_id (
        id,
        company_name
      )
    `,
    )
    .eq("id", params.job_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  console.warn("data in route handler", data);

  return NextResponse.json(data);
}
