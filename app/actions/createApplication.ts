"use server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { APPLICATION_STATUS } from "@/lib/constants/applicationStatus";
import { withRateLimit } from "@/lib/withRateLimit";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/errorHandling";
import { mpServerTrack } from "@/lib/mixpanelServer";
import { ServerActionResult } from "@/lib/sharedTypes";

export type CreateApplicationArgs = Pick<ApplicationTable, "job_posting_id" | "applied_date"> & {
  job_title: string;
  company_name: string;
};

const actionCreateApplication = async (_key: string, { arg }: { arg: CreateApplicationArgs }): Promise<ServerActionResult> => {
  return await withRateLimit(async (user_id) => {
    const { job_posting_id, applied_date, job_title, company_name } = arg;
    const supabase = await createClerkSupabaseClientSsr();

    try {
      const { error } = await supabase
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

        if (error.code === ERROR_CODES.UNIQUE_VIOLATION) {
          await mpServerTrack("Duplicate application error", {
            job_posting_id,
            applied_date,
            error_message: error.message,
            user_id,
          });

          return { isSuccess: false, error: ERROR_MESSAGES.DUPLICATE_APPLICATION };
        } else {
          await mpServerTrack("Job Posting Page", {
            action: "track_this_job_error",
            job_id: job_posting_id,
            error: error instanceof Error ? error.message : "Unknown error occurred",
            job_title,
            company_name,
          });

          return { isSuccess: false, error: error.message };
        }
      }

      await mpServerTrack("Job Posting Page - Job Tracked Successfully", {
        action: "track_this_job_submitted",
        job_id: job_posting_id,
        applied_date,
        job_title,
        company_name,
      });

      return { isSuccess: true };
    } catch (err) {
      console.error("Error executing insert:", err);
      throw err;
    }
  }, "TrackApplication");
};

export default actionCreateApplication;
