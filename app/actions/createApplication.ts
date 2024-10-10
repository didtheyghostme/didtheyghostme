"use server";

import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { APPLICATION_STATUS } from "@/lib/constants/applicationStatus";

export type CreateApplicationArgs = {
  job_posting_id: number;
  applied_at: string;
};

const actionCreateApplication = async (key: string, { arg }: { arg: CreateApplicationArgs }): Promise<ApplicationTable> => {
  const { job_posting_id, applied_at } = arg;
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
        applied_at,
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
};

export default actionCreateApplication;
