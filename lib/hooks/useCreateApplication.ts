import useSWRMutation from "swr/mutation";

import actionCreateApplication from "@/app/actions/createApplication";
import { API } from "@/lib/constants/apiRoutes";

export const useCreateApplication = (job_posting_id: string) => {
  const { trigger, isMutating } = useSWRMutation(API.APPLICATION.getAllByJobPostingId(job_posting_id), actionCreateApplication);

  return {
    createApplication: async (applied_date: string) => {
      try {
        const result = await trigger({ job_posting_id, applied_date });

        return result;
      } catch (err) {
        console.error("Error creating application:", err);
        throw err;
      }
    },
    isCreating: isMutating,
  };
};
