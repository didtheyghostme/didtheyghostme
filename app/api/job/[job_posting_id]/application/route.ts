import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { processDataOwnershipArray } from "@/lib/processDataOwnership";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/errorHandling";

export type GetAllApplicationsByJobPostingIdResponse = ProcessedApplications;

export async function GET(request: Request, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<JoinedApplication> = {
    id: true,
    status: true,
    applied_date: true,
    first_response_date: true,
    created_at: true,
    updated_at: false,
    job_posting_id: true,
    user_id: true,
    [DBTable.USER_DATA]: {
      full_name: true,
      profile_pic_url: true,
    },
  };

  const selectString = buildSelectString(selectObject);

  const { data, error } = await supabase.from(DBTable.APPLICATION).select(selectString).eq("job_posting_id", params.job_posting_id).overrideTypes<JoinedApplication[], { merge: false }>();

  // console.warn("data in route handler applications", data, error);

  if (error) {
    if (error.code === ERROR_CODES.INVALID_TEXT_REPRESENTATION) {
      return NextResponse.json({ error: ERROR_MESSAGES.NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const processedData = processDataOwnershipArray(data || []);

  return NextResponse.json(processedData);
}
