"use server";

import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { APPLICATION_STATUS } from "@/lib/constants/applicationStatus";
import { withRateLimit } from "@/lib/withRateLimit";

export type CreateApplicationArgs = Pick<ApplicationTable, "job_posting_id" | "applied_date">;

const actionCreateApplication = async (key: string, { arg }: { arg: CreateApplicationArgs }): Promise<ApplicationTable> => {
  return await withRateLimit(async () => {
    const { job_posting_id, applied_date } = arg;
    const supabase = await createClerkSupabaseClientSsr();
    const { userId: user_id } = auth();

    if (!user_id) {
      throw new Error("User not authenticated");
    }

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
        console.error("Insert error fail:", error);
        throw new Error(error.message);
      }

      return data;
    } catch (err) {
      console.error("Error executing insert:", err);
      throw err;
    }
  });
};

export default actionCreateApplication;
