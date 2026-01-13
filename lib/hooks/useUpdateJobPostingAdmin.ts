import useSWRMutation from "swr/mutation";

import { API } from "@/lib/constants/apiRoutes";
import { UpdateJobPostingAdminFormValues } from "@/lib/schema/updateJobPostingAdminSchema";
import actionUpdateJobPostingAdmin, { UpdateJobPostingAdminResult } from "@/app/actions/updateJobPostingAdmin";

export const useUpdateJobPostingAdmin = (job_posting_id: string) => {
  const { trigger, isMutating } = useSWRMutation(API.ADMIN.getAllJobs, actionUpdateJobPostingAdmin);

  return {
    updateJobPosting: async (updates: UpdateJobPostingAdminFormValues): Promise<UpdateJobPostingAdminResult> => {
      try {
        const result = await trigger({
          job_posting_id,
          updates,
        });

        return (result ?? {}) as UpdateJobPostingAdminResult;
      } catch (err) {
        console.error("Error updating job posting:", err);
        throw err;
      }
    },
    isUpdating: isMutating,
  };
};
