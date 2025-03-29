"use server";

import { z } from "zod";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { AddJobFormData, addJobSchema } from "@/lib/schema/addJobSchema";
import { withRateLimit } from "@/lib/withRateLimit";
import { DB_RPC } from "@/lib/constants/apiRoutes";
import { isLinkedInDomain } from "@/lib/extractDomain";
import { mpServerTrack } from "@/lib/mixpanelServer";
import { ERROR_MESSAGES, isRateLimitError } from "@/lib/errorHandling";

export type CreateJobArgs = Pick<JobPostingTable, "company_id"> & {
  newJob: AddJobFormData;
  company_name: string;
};

// Define a response type for success/error states
type JobActionResult = { success: true } | { success: false; error: string };

const actionCreateJob = async (key: string, { arg }: { arg: CreateJobArgs }): Promise<JobActionResult> => {
  try {
    return await withRateLimit(async (user_id) => {
      const supabase = await createClerkSupabaseClientSsr();
      const { company_id, newJob, company_name } = arg;

      try {
        // Server-side validation
        const validatedData = addJobSchema.parse(newJob);

        const isLinkedInUrl = isLinkedInDomain(validatedData.url);

        const { error } = await supabase.rpc(DB_RPC.INSERT_JOB_WITH_COUNTRIES, {
          p_title: validatedData.title,
          p_url: validatedData.url,
          p_company_id: company_id,
          p_user_id: user_id,
          p_country_names: validatedData.countries,
          p_experience_level_names: validatedData.experience_level_names,
          p_job_category_names: validatedData.job_category_names,
          p_job_url_linkedin: isLinkedInUrl ? validatedData.url : null,
        });

        if (error) {
          console.error("Create Job RPC error:", error.message);

          // Track error on server
          await mpServerTrack("Job Added Error", {
            company_name,
            company_id,
            job_title: validatedData.title,
            countries: validatedData.countries,
            experience_level_names: validatedData.experience_level_names,
            job_category_names: validatedData.job_category_names,
            job_url: validatedData.url,
            error_message: error.message,
            user_id,
          });

          return { success: false, error: error.message };
        }

        // Track success on server
        await mpServerTrack("Job Added Success", {
          company_name,
          company_id,
          job_title: validatedData.title,
          countries: validatedData.countries,
          experience_level_names: validatedData.experience_level_names,
          job_category_names: validatedData.job_category_names,
          job_url: validatedData.url,
          user_id,
        });

        return { success: true };
      } catch (err) {
        // Determine error message
        console.error("Create Job error:", err);

        const errorMessage = err instanceof z.ZodError ? err.errors.map((issue) => issue.message).join(", ") : err instanceof Error ? err.message : "Unknown error occurred";

        // Track all errors that reach this catch block
        await mpServerTrack("Job Added Error", {
          company_name,
          company_id,
          job_title: newJob.title,
          countries: newJob.countries,
          experience_level_names: newJob.experience_level_names,
          job_category_names: newJob.job_category_names,
          job_url: newJob.url,
          error: errorMessage,
          user_id,
        });

        return { success: false, error: errorMessage };
      }
    }, "CreateJob");
  } catch (error) {
    // Handle rate limit errors or other withRateLimit errors
    console.error("Rate limit or wrapper error:", error);

    // Use your type guard to check for rate limit errors
    if (isRateLimitError(error)) {
      return { success: false, error: ERROR_MESSAGES.TOO_MANY_REQUESTS };
    }

    // For any other errors from withRateLimit
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export default actionCreateJob;
