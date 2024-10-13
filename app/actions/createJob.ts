"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { AddJobFormData, addJobSchema } from "@/lib/schema/addJobSchema";
import { DBTable } from "@/lib/constants/dbTables";

export type CreateJobArgs = Pick<JobPostingTable, "company_id"> & {
  newJob: AddJobFormData;
};

const actionCreateJob = async (key: string, { arg }: { arg: CreateJobArgs }): Promise<JobPostingTable> => {
  const supabase = await createClerkSupabaseClientSsr();
  const { userId: user_id } = auth();
  const { company_id, newJob } = arg;

  try {
    // Server-side validation
    const validatedData = addJobSchema.parse(newJob);

    const { data, error } = await supabase
      .from(DBTable.JOB_POSTING)
      .insert({ ...validatedData, company_id, user_id })
      .select();

    if (error) {
      console.error("Insert error fail:", error.message);
      throw new Error(error.message);
    }

    return data[0];
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error("Zod validation error:", err.errors);
      throw new Error(err.errors.map((issue) => issue.message).join(", "));
    }
    console.error("Error executing insert:", err);
    throw err;
  }
};

export default actionCreateJob;
