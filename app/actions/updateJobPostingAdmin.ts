"use server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { checkRole } from "@/lib/clerkRoles";
import { updateJobPostingAdminSchema, UpdateJobPostingAdminFormValues } from "@/lib/schema/updateJobPostingAdminSchema";
import { JOB_STATUS } from "@/lib/constants/jobPostingStatus";

type UpdateJobPostingAdminArgs = {
  job_posting_id: string;
  updates: UpdateJobPostingAdminFormValues;
  oldJobStatus: JobStatus;
};

const actionUpdateJobPostingAdmin = async (key: string, { arg }: { arg: UpdateJobPostingAdminArgs }) => {
  if (!checkRole("admin")) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClerkSupabaseClientSsr();
  const { job_posting_id, updates, oldJobStatus } = arg;

  try {
    const validatedData = updateJobPostingAdminSchema.parse(updates);

    // Check if status is changing from "No URL" to Verified
    const shouldUpdateTimestamp = oldJobStatus === JOB_STATUS["No URL"] && validatedData.job_status === JOB_STATUS.Verified;

    const updateData = {
      ...validatedData,
      ...(shouldUpdateTimestamp && { updated_at: new Date().toISOString() }),
    };

    const { error } = await supabase.from("job_posting").update(updateData).eq("id", job_posting_id);

    if (error) throw error;
  } catch (err) {
    console.error("Error updating job posting:", err);
    throw err;
  }
};

export default actionUpdateJobPostingAdmin;
