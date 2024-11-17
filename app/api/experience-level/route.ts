import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";

export type ExperienceLevelSelect = Pick<ExperienceLevelTable, "id" | "experience_level">;

export async function GET() {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<ExperienceLevelSelect> = {
    id: true,
    experience_level: true,
  };

  const selectString = buildSelectString(selectObject);

  const { data: experienceLevels, error } = await supabase.from(DBTable.EXPERIENCE_LEVEL).select(selectString).order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching experience levels:", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(experienceLevels);
}
