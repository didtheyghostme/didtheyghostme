import { NextRequest, NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/errorHandling";

export type GetAllReviewsByJobPostingIdResponse = Array<
  Pick<ApplicationReviewTable, "id" | "content" | "created_at" | "updated_at"> & {
    [DBTable.APPLICATION]: Pick<ApplicationTable, "id" | "job_posting_id" | "created_at"> & {
      [DBTable.USER_DATA]: Pick<UserDataTable, "full_name" | "profile_pic_url">;
    };
  }
>;

export async function GET(_request: NextRequest, { params }: { params: { job_posting_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<GetAllReviewsByJobPostingIdResponse[number]> = {
    id: true,
    content: true,
    created_at: true,
    updated_at: true,
    [DBTable.APPLICATION]: {
      id: true,
      job_posting_id: true,
      created_at: true,
      [DBTable.USER_DATA]: {
        full_name: true,
        profile_pic_url: true,
      },
    },
  };

  const selectString = buildSelectString(selectObject);

  const { data, error } = await supabase
    .from(DBTable.APPLICATION_REVIEW)
    .select(selectString)
    .eq(`${DBTable.APPLICATION}.job_posting_id`, params.job_posting_id)
    .order("created_at", { ascending: false })
    .overrideTypes<GetAllReviewsByJobPostingIdResponse, { merge: false }>();

  if (error) {
    if (error.code === ERROR_CODES.INVALID_TEXT_REPRESENTATION) {
      return NextResponse.json({ error: ERROR_MESSAGES.NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
