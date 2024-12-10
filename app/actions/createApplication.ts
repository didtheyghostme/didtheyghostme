"use server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { APPLICATION_STATUS } from "@/lib/constants/applicationStatus";
import { withRateLimit } from "@/lib/withRateLimit";

export type CreateApplicationArgs = Pick<ApplicationTable, "job_posting_id" | "applied_date">;

const actionCreateApplication = async (key: string, { arg }: { arg: CreateApplicationArgs }): Promise<ApplicationTable> => {
  return await withRateLimit(async (user_id) => {
    const { job_posting_id, applied_date } = arg;
    const supabase = await createClerkSupabaseClientSsr();

    try {
      const { data, error } = await supabase
        .from(DBTable.APPLICATION)
        .insert<InsertApplication>({
          status: APPLICATION_STATUS.APPLIED,
          applied_date,
          user_id,
          job_posting_id,
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error fail for createApplication:", error);
        throw new Error(error.message);
      }

      return data;
    } catch (err) {
      console.error("Error executing insert:", err);
      throw err;
    }
  }, "TrackApplication");
};

export default actionCreateApplication;
