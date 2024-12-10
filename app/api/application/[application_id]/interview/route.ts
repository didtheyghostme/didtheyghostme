import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DB_RPC } from "@/lib/constants/apiRoutes";

export async function GET(request: Request, { params }: { params: { application_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.rpc(DB_RPC.GET_INTERVIEW_ROUNDS_WITH_TAG_NAMES, {
    p_application_id: params.application_id,
  });

  // console.warn("data in route handler all interview rounds", data, error);

  if (error) {
    console.error("error in route handler all interview rounds", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
