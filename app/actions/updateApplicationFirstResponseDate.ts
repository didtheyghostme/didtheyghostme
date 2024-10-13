"use server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";

export type UpdateApplicationFirstResponseDateArgs = Pick<ApplicationTable, "id" | "first_response_date">;

const actionUpdateApplicationFirstResponseDate = async (key: string, { arg }: { arg: UpdateApplicationFirstResponseDateArgs }): Promise<ApplicationTable> => {
  const { id, first_response_date } = arg;
  const supabase = await createClerkSupabaseClientSsr();

  try {
    const { data, error } = await supabase.from(DBTable.APPLICATION).update({ first_response_date }).match({ id }).select().single();

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
