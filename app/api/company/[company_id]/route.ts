import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString } from "@/lib/buildSelectString";
import { SelectObject } from "@/lib/buildSelectString";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/errorHandling";

// TODO 5 nov: select only required fields, get positions statistics in future / remove the statisics for now?

export type CompanyDetailsPageCompanyResponse = Pick<CompanyTable, "company_name" | "company_url" | "logo_url">;

export async function GET(request: Request, { params }: { params: { company_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<CompanyDetailsPageCompanyResponse> = {
    company_name: true,
    company_url: true,
    logo_url: true,
  };

  let selectString = buildSelectString(selectObject);

  const { data, error } = await supabase.from(DBTable.COMPANY).select(selectString).eq("id", params.company_id).maybeSingle();

  if (error) {
    if (error.code === ERROR_CODES.INVALID_TEXT_REPRESENTATION) {
      return NextResponse.json({ error: ERROR_MESSAGES.NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
