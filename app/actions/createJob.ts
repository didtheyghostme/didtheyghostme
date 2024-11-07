"use server";

import { z } from "zod";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { AddJobFormData, addJobSchema } from "@/lib/schema/addJobSchema";
import { DBTable } from "@/lib/constants/dbTables";
import { withRateLimit } from "@/lib/withRateLimit";

export type CreateJobArgs = Pick<JobPostingTable, "company_id"> & {
  newJob: AddJobFormData;
};

type InsertedJobData = AddJobFormData & Pick<JobPostingTable, "company_id" | "user_id" | "job_status">;

const actionCreateJob = async (key: string, { arg }: { arg: CreateJobArgs }): Promise<JobPostingTable> => {
  return await withRateLimit(async (user_id) => {
    const supabase = await createClerkSupabaseClientSsr();
    const { company_id, newJob } = arg;

    try {
      // Server-side validation
      const validatedData = addJobSchema.parse(newJob);

      const insertedData: InsertedJobData = {
        ...validatedData,
        company_id,
        user_id,
        job_status: validatedData.url === null ? "No URL" : "Pending",
      };

      const { data, error } = await supabase.from(DBTable.JOB_POSTING).insert(insertedData).select();

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
  }, "CreateJob");
};

export default actionCreateJob;
