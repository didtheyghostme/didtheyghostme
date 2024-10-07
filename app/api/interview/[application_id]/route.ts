import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { processDataOwnershipArray } from "@/lib/processDataOwnership";

export async function GET(request: Request, { params }: { params: { application_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();
  // TODO: change to DBTable.INTERVIEW, query to get all interviews for an application
  const { data, error } = await supabase.from(DBTable.APPLICATION).select().eq("id", params.application_id);

  console.warn("data in route handler interview", data);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const processedData = processDataOwnershipArray(data);

  return NextResponse.json(processedData);
}
