import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { processDataOwnershipObject } from "@/lib/processDataOwnership";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/errorHandling";

export type GetApplicationByIdResponse = ProcessedApplication & {
  [DBTable.JOB_POSTING]: Pick<JobPostingTable, "title"> & {
    [DBTable.COMPANY]: Pick<CompanyTable, "company_name" | "logo_url">;
  };
};

type JoinedApplicationWithCompany = JoinedApplication & {
  [DBTable.JOB_POSTING]: Pick<JobPostingTable, "title"> & {
    [DBTable.COMPANY]: Pick<CompanyTable, "company_name" | "logo_url">;
  };
};

export async function GET(request: Request, { params }: { params: { application_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<JoinedApplicationWithCompany> = {
    id: true,
    status: true,
    applied_date: true,
    first_response_date: true,
    created_at: true,
    job_posting_id: true,
    updated_at: true,
    user_id: true,
    [DBTable.USER_DATA]: {
      full_name: true,
      profile_pic_url: true,
    },
    [DBTable.JOB_POSTING]: {
      title: true,
      [DBTable.COMPANY]: {
        company_name: true,
        logo_url: true,
      },
    },
  };

  const selectString = buildSelectString(selectObject);

  const { data, error } = await supabase.from(DBTable.APPLICATION).select(selectString).eq("id", params.application_id).maybeSingle().overrideTypes<JoinedApplication, { merge: false }>();

  // console.warn("data in route handler application", data, error);

  if (error) {
    if (error.code === ERROR_CODES.INVALID_TEXT_REPRESENTATION) {
      return NextResponse.json({ error: ERROR_MESSAGES.NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Application of interview not found" }, { status: 404 });
  }

  const processedData = processDataOwnershipObject(data);

  return NextResponse.json(processedData);
}
