"use server";

import { z } from "zod";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { AddJobFormData, addJobSchema } from "@/lib/schema/addJobSchema";
import { withRateLimit } from "@/lib/withRateLimit";
import { DB_RPC } from "@/lib/constants/apiRoutes";

export type CreateJobArgs = Pick<JobPostingTable, "company_id"> & {
  newJob: AddJobFormData;
};

const actionCreateJob = async (key: string, { arg }: { arg: CreateJobArgs }): Promise<void> => {
  return await withRateLimit(async (user_id) => {
    const supabase = await createClerkSupabaseClientSsr();
    const { company_id, newJob } = arg;

    try {
      // Server-side validation
      const validatedData = addJobSchema.parse(newJob);

      const { error } = await supabase.rpc(DB_RPC.INSERT_JOB_WITH_COUNTRIES, {
        p_title: validatedData.title,
        p_url: validatedData.url,
        p_company_id: company_id,
        p_user_id: user_id,
        p_country_ids: validatedData.countries,
        p_experience_level_ids: validatedData.experience_level_id,
      });

      if (error) {
        console.error("RPC error:", error.message);
        throw new Error(error.message);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error("Zod validation error:", err.errors);
        throw new Error(err.errors.map((issue) => issue.message).join(", "));
      }
      console.error("Error executing RPC:", err);
      throw err;
    }
  }, "CreateJob");
};

export default actionCreateJob;
