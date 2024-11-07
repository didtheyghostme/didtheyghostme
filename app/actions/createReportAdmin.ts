"use server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { withRateLimit } from "@/lib/withRateLimit";

export type CreateReportAdminArgs = Pick<ReportAdminTable, "entity_type" | "entity_id" | "report_type" | "report_message">;

const actionCreateReportAdmin = async (key: string, { arg }: { arg: CreateReportAdminArgs }): Promise<void> => {
  return await withRateLimit(async (user_id) => {
    const supabase = await createClerkSupabaseClientSsr();

    const { error } = await supabase.from(DBTable.REPORT_ADMIN).insert({
      entity_type: arg.entity_type,
      entity_id: arg.entity_id,
      report_type: arg.report_type,
      report_message: arg.report_message,
      user_id,
    });

    if (error) {
      console.error("Error creating report:", error);
      throw new Error(error.message);
    }
  }, "ReportAdmin");
};

export default actionCreateReportAdmin;
