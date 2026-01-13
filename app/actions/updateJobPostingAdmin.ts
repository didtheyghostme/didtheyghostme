"use server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { checkRole } from "@/lib/clerkRoles";
import { updateJobPostingAdminSchema, UpdateJobPostingAdminFormValues } from "@/lib/schema/updateJobPostingAdminSchema";
import { DB_RPC } from "@/lib/constants/apiRoutes";
import { DBTable } from "@/lib/constants/dbTables";
import { JOB_STATUS } from "@/lib/constants/jobPostingStatus";
import { syncReadmeSgInternTechVerifiedJobs } from "@/lib/readme-sync/syncReadmeSgInternTech";

type UpdateJobPostingAdminArgs = {
  job_posting_id: string;
  updates: UpdateJobPostingAdminFormValues;
};

export type UpdateJobPostingAdminResult = {
  readmeSync?: { ok: true; didChange: boolean; exportedCount: number; commitMessage?: string } | { ok: false; error: string };
};

const actionUpdateJobPostingAdmin = async (key: string, { arg }: { arg: UpdateJobPostingAdminArgs }) => {
  const isAdmin = await checkRole("admin");

  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClerkSupabaseClientSsr();
  const { job_posting_id, updates } = arg;

  try {
    const { data: existingJob, error: existingJobError } = await supabase.from(DBTable.JOB_POSTING).select("job_status").eq("id", job_posting_id).maybeSingle();

    if (existingJobError) throw existingJobError;

    const validatedData = updateJobPostingAdminSchema.parse(updates);

    const { error } = await supabase.rpc(DB_RPC.UPDATE_JOB_WITH_COUNTRIES, {
      p_job_posting_id: job_posting_id,
      p_title: validatedData.title,
      p_url: validatedData.url,
      p_job_url_linkedin: validatedData.job_url_linkedin,
      p_country_ids: validatedData.countries,
      p_closed_date: validatedData.closed_date,
      p_job_status: validatedData.job_status,
      p_job_posted_date: validatedData.job_posted_date,
      p_experience_level_ids: validatedData.experience_level_ids,
      p_job_category_ids: validatedData.job_category_ids,
    });

    if (error) throw error;

    const oldStatus = existingJob?.job_status as JobStatus | undefined;
    const newStatus = validatedData.job_status as JobStatus;

    const shouldSyncReadme = oldStatus === JOB_STATUS.Verified || newStatus === JOB_STATUS.Verified;

    if (!shouldSyncReadme) return {} satisfies UpdateJobPostingAdminResult;

    try {
      const syncResult = await syncReadmeSgInternTechVerifiedJobs();

      return { readmeSync: { ok: true, ...syncResult } } satisfies UpdateJobPostingAdminResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";

      return { readmeSync: { ok: false, error: message } } satisfies UpdateJobPostingAdminResult;
    }
  } catch (err) {
    console.error("Error updating job posting:", err);
    throw err;
  }
};

export default actionUpdateJobPostingAdmin;
