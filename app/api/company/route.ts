// app/api/company/route.ts

import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";

export type GetAllCompaniesResponse = Pick<CompanyTable, "id" | "company_name" | "company_url">;

export async function GET() {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<GetAllCompaniesResponse> = {
    id: true,
    company_name: true,
    company_url: true,
  };

  const selectString = buildSelectString(selectObject);

  const { data, error } = await supabase.from(DBTable.COMPANY).select(selectString);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
