import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { processUserData } from "@/lib/processUserData";
import { DBTable } from "@/lib/constants/dbTables";

export async function GET(request: Request, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.from(DBTable.APPLICATION).select().eq("job_posting_id", params.job_posting_id);

  console.warn("data in route handler applications", data);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const processedData = processUserData(data);

  return NextResponse.json(processedData);
}
