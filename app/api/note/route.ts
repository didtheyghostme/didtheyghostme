// app/api/note/route.ts

import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";

export async function GET() {
  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.from("notes").select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
