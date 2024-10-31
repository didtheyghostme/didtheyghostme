import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

import { buildSelectString } from "@/lib/buildSelectString";
import { SelectObject } from "@/lib/buildSelectString";
import { DBTable } from "@/lib/constants/dbTables";
import { InterviewExperienceCardData } from "@/lib/sharedTypes";
import { createClerkSupabaseClientSsr } from "@/lib/supabase";

export type GetOnlineAssessmentsByJobPostingIdResponse = InterviewExperienceCardData & {
  [DBTable.APPLICATION]: Pick<ApplicationTable, "id">;
};

export async function GET(request: NextRequest, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<GetOnlineAssessmentsByJobPostingIdResponse> = {
    id: true,
    round_no: true,
    difficulty: true,
    description: true,
    interview_date: true,
    response_date: true,
    interview_tags: true,
    created_at: true,
    [DBTable.APPLICATION]: {
      id: true,
    },
    [DBTable.USER_DATA]: {
      full_name: true,
      profile_pic_url: true,
    },
  };

  const selectString = buildSelectString(selectObject);

  const { data, error } = await supabase
    .from(DBTable.INTERVIEW_EXPERIENCE)
    .select(selectString)
    .eq(`${DBTable.APPLICATION}.job_posting_id`, params.job_posting_id)
    .contains("interview_tags", ["Online Assessment"]);

  //   console.error("error fetching online assessments", data, error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
