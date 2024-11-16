import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";
import { MyApplicationResponse } from "@/app/(protected)/applications/page";

export async function GET() {
  const { userId } = auth();
  const supabase = await createClerkSupabaseClientSsr();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const selectObject: SelectObject<MyApplicationResponse> = {
    id: true,
    status: true,
    applied_date: true,
    first_response_date: true,
    created_at: true,
    [DBTable.JOB_POSTING]: {
      id: true,
      title: true,
      [DBTable.COMPANY]: {
        id: true,
        company_name: true,
        logo_url: true,
      },
    },
  };

  const selectString = buildSelectString(selectObject);

  const { data, error } = await supabase.from(DBTable.APPLICATION).select(selectString).eq("user_id", userId).order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
