import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();
  const { data, error } = await supabase.from("company").select().eq("id", params.id).single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
