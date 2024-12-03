import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { SelectObject } from "@/lib/buildSelectString";
import { buildSelectString } from "@/lib/buildSelectString";

export type JobCategorySelect = Pick<JobCategoryTable, "id" | "job_category_name">;

export async function GET() {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<JobCategorySelect> = {
    id: true,
    job_category_name: true,
  };

  const selectString = buildSelectString(selectObject);

  const { data: categories, error } = await supabase.from(DBTable.JOB_CATEGORY).select(selectString).order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching job categories:", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(categories);
}
