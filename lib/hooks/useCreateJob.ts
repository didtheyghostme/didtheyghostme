import useSWRMutation from "swr/mutation";

import actionCreateJob from "@/app/actions/createJob";
import { AddJobFormData } from "@/lib/schema/addJobSchema";
import { API } from "@/lib/constants/apiRoutes";

const useCreateJob = (company_id: string) => {
  const { trigger, isMutating } = useSWRMutation(API.JOB_POSTING.getAllByCompanyId(company_id), actionCreateJob);

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
