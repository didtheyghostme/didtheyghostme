import { NextResponse, type NextRequest } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DB_RPC } from "@/lib/constants/apiRoutes";

export type JobPostPageInterviewData = Pick<ApplicationTable, "id" | "applied_date" | "first_response_date" | "created_at" | "status"> &
  ClerkUserProfileData & {
    number_of_rounds: number;
    number_of_comments: number;
    interview_tags: InterviewTag[] | null;
  };

export async function GET(request: NextRequest, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  // Call the RPC function instead of direct select
  const { data, error } = await supabase.rpc(DB_RPC.GET_APPLICATIONS_WITH_INTERVIEW_STATS, {
    job_posting_id_param: params.job_posting_id,
  });

  // console.log("data RPC@@@@@@@", data, error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
