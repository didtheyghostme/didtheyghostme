"use server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";

type ServerUpdateApplicationArgs = Pick<ApplicationTable, "id" | "applied_date" | "first_response_date" | "status">;

export type ClientUpdateApplicationArgs = Omit<ServerUpdateApplicationArgs, "id">;

const actionUpdateApplicationFirstResponseDate = async (key: string, { arg }: { arg: ServerUpdateApplicationArgs }): Promise<ApplicationTable> => {
  const { id, applied_date, first_response_date, status } = arg;
  const supabase = await createClerkSupabaseClientSsr();

  try {
    const { data, error } = await supabase.from(DBTable.APPLICATION).update({ applied_date, first_response_date, status }).match({ id }).select().single();

    if (error) {
      console.error("Update error:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (err) {
    console.error("Error executing update:", err);
    throw err;
  }
};

export default actionUpdateApplicationFirstResponseDate;
