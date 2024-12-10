import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

import { InterviewExperienceCardData } from "@/lib/sharedTypes";
import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DB_RPC } from "@/lib/constants/apiRoutes";

export type GetOnlineAssessmentsByJobPostingIdResponse = InterviewExperienceCardData & Pick<InterviewExperienceTable, "application_id">;

export async function GET(request: NextRequest, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase.rpc(DB_RPC.GET_ONLINE_ASSESSMENTS_BY_JOB_POSTING_ID, { p_job_posting_id: params.job_posting_id });

  if (error) {
    console.error("error in route handler get online assessments by job posting id", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
