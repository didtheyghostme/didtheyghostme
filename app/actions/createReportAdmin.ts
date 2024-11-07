"use server";

import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { withRateLimit } from "@/lib/withRateLimit";

export type CreateReportAdminArgs = Pick<ReportAdminTable, "entity_type" | "entity_id" | "report_type" | "report_message">;

const actionCreateReportAdmin = async (key: string, { arg }: { arg: CreateReportAdminArgs }): Promise<void> => {
  return await withRateLimit(async () => {
    const supabase = await createClerkSupabaseClientSsr();
    const { userId: user_id } = auth();

    if (!user_id) {
      throw new Error("User not authenticated");
    }

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
  });
};

export default actionCreateReportAdmin;
