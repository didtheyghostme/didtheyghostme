import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DB_TABLE } from "@/lib/constants/dbTables";

export async function GET(request: Request, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.from(DB_TABLE.APPLICATION).select().eq("job_posting_id", params.job_posting_id);

  console.warn("data in route handler applications", data);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
