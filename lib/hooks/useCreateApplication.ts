import useSWRMutation from "swr/mutation";

import actionCreateApplication from "@/app/actions/createApplication";

export const useCreateApplication = (job_posting_id: number) => {
  const { trigger, isMutating } = useSWRMutation(`/api/job/${job_posting_id}/application`, actionCreateApplication);

  return {
    createApplication: async (applied_at: string) => {
      try {
        const result = await trigger({ job_posting_id, applied_at });

        return result;
      } catch (err) {
        console.error("Error creating application:", err);
        throw err;
      }
    },
    isCreating: isMutating,
  };
};
