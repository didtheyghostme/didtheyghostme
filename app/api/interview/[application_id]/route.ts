import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { processUserData } from "@/lib/processUserData";
import { DBTable } from "@/lib/constants/dbTables";

export async function GET(request: Request, { params }: { params: { application_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.from(DBTable.APPLICATION).select().eq("id", params.application_id);

  console.warn("data in route handler interview", data);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const processedData = processUserData(data);

  return NextResponse.json(processedData);
}
