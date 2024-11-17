import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";

export type AvailableCountry = {
  id: string;
  country_name: string;
};

export async function GET() {
  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.rpc("get_available_countries");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
