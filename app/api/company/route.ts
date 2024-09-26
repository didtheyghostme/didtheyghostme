// app/api/company/route.ts

import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DB_TABLE } from "@/lib/constants/dbTables";

export async function GET() {
  const supabase = await createClerkSupabaseClientSsr();
  const { data, error } = await supabase.from(DB_TABLE.COMPANY).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
