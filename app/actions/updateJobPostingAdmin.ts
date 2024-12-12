"use server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { checkRole } from "@/lib/clerkRoles";
import { updateJobPostingAdminSchema, UpdateJobPostingAdminFormValues } from "@/lib/schema/updateJobPostingAdminSchema";
import { DB_RPC } from "@/lib/constants/apiRoutes";

type UpdateJobPostingAdminArgs = {
  job_posting_id: string;
  updates: UpdateJobPostingAdminFormValues;
};

const actionUpdateJobPostingAdmin = async (key: string, { arg }: { arg: UpdateJobPostingAdminArgs }) => {
  if (!checkRole("admin")) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClerkSupabaseClientSsr();
  const { job_posting_id, updates } = arg;

  try {
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
  } catch (err) {
    console.error("Error updating job posting:", err);
    throw err;
  }
};

export default actionUpdateJobPostingAdmin;
