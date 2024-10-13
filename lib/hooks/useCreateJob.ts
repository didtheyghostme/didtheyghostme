import useSWRMutation from "swr/mutation";

import actionCreateJob from "@/app/actions/createJob";
import { AddJobFormData } from "@/lib/schema/addJobSchema";

const useCreateJob = (company_id: string) => {
  const { trigger, isMutating } = useSWRMutation(`/api/company/${company_id}/job`, actionCreateJob);

  return {
    createJob: async (newJob: AddJobFormData) => {
      try {
        const result = await trigger({ company_id, newJob });

        return result;
      } catch (err) {
        console.error("Error adding job:", err);
        throw err;
      }
    },
    isCreating: isMutating,
  };
};

export { useCreateJob };
