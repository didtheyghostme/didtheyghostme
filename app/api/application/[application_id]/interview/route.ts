import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { InterviewExperienceCardData } from "@/lib/sharedTypes";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";

export async function GET(request: Request, { params }: { params: { application_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<InterviewExperienceCardData> = {
    id: true,
    round_no: true,
    difficulty: true,
    description: true,
    interview_date: true,
    response_date: true,
    interview_tags: true,
    created_at: true,
    [DBTable.USER]: {
      full_name: true,
      profile_pic_url: true,
    },
  };

  const selectString = buildSelectString(selectObject);

  const { data, error } = await supabase.from(DBTable.INTERVIEW_EXPERIENCE).select(selectString).eq("application_id", params.application_id).order("round_no", { ascending: true });

  console.warn("data in route handler all interview rounds", data);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
