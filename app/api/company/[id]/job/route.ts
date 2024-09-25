import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();
  const { data, error } = await supabase.from("job_posting").select().eq("company_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
