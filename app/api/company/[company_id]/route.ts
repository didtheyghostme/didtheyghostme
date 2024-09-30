import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";

export async function GET(request: Request, { params }: { params: { company_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();
  const { data, error } = await supabase.from(DBTable.COMPANY).select().eq("id", params.company_id).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
