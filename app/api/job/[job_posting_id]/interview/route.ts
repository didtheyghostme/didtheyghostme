import { NextResponse, type NextRequest } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";
import { JobPostPageInterviewData } from "@/app/job/[job_posting_id]/InterviewExperienceCard";

export async function GET(request: NextRequest, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  // Define the select object with default inner joins and optional left joins
  const selectObject: SelectObject<JobPostPageInterviewData> = {
    id: true,
    round_no: true,
    difficulty: true,
    description: true,
    interview_date: true,
    response_date: true,
    interview_tags: true,
    created_at: true,
    [DBTable.APPLICATION]: {
      // Inner join (default)
      id: true,
      job_posting_id: true,
      status: true,
    },
    [DBTable.USER]: {
      __isLeftJoin: true, // Specify left join for user
      full_name: true,
      profile_pic_url: true,
    },
  };

  const selectString = buildSelectString(selectObject);

  console.log("select query of this interview experience", selectString);

  let query = supabase.from(DBTable.INTERVIEW_EXPERIENCE).select(selectString).eq(`${DBTable.APPLICATION}.job_posting_id`, params.job_posting_id);

  const { data, error } = await query;

  console.log("data of all interview experience", data, error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
