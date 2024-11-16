import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";

export async function GET() {
  const supabase = await createClerkSupabaseClientSsr();

  const { data: countries, error } = await supabase.from(DBTable.COUNTRY).select("id, country_name").order("country_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(countries);
}
