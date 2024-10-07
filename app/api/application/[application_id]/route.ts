import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { processDataOwnershipItem } from "@/lib/processDataOwnership";

export async function GET(request: Request, { params }: { params: { application_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.from(DBTable.APPLICATION).select().eq("id", params.application_id).maybeSingle();

  console.warn("data in route handler application", data);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Application of interview not found" }, { status: 404 });
  }

  const processedData = processDataOwnershipItem(data);

  return NextResponse.json(processedData);
}
