import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";

export type AdminPickedKeys = Pick<ReportAdminTable, "id" | "entity_type" | "entity_id" | "report_type" | "report_message" | "report_status" | "created_at" | "resolution_notes">;

export type AdminReportResponse = AdminPickedKeys & {
  reporter: ClerkUserProfileData;
  handler: ClerkUserProfileData;
};

export async function GET() {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<AdminPickedKeys> = {
    id: true,
    entity_type: true,
    entity_id: true,
    report_type: true,
    report_message: true,
    report_status: true,
    created_at: true,
    resolution_notes: true,
  };

  let selectString = buildSelectString(selectObject);

  selectString += ", reporter:user_data!report_admin_user_id_fkey(full_name, profile_pic_url), handler:user_data!report_admin_handled_by_fkey(full_name, profile_pic_url)";

  const { data, error } = await supabase.from(DBTable.REPORT_ADMIN).select(selectString).order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
