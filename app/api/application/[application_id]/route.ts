import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { processDataOwnershipObject } from "@/lib/processDataOwnership";

export type GetApplicationByIdResponse = ProcessedApplication;

export async function GET(request: Request, { params }: { params: { application_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.from(DBTable.APPLICATION).select(`*, ${DBTable.USER}(full_name, profile_pic_url)`).eq("id", params.application_id).maybeSingle();

  console.warn("data in route handler application", data, error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Application of interview not found" }, { status: 404 });
  }

  const processedData = processDataOwnershipObject(data);

  return NextResponse.json(processedData);
}
