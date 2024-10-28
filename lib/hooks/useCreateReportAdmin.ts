import useSWRMutation from "swr/mutation";

import { getErrorMessage } from "@/lib/errorHandling";
import actionCreateReportAdmin, { CreateReportAdminArgs } from "@/app/actions/createReportAdmin";

export const useCreateReportAdmin = () => {
  const { trigger, isMutating } = useSWRMutation("/api/report", actionCreateReportAdmin);

  return {
    createReportAdmin: async (reportData: CreateReportAdminArgs) => {
      try {
        const result = await trigger(reportData);

        return result;
      } catch (err) {
        const errorMessage = getErrorMessage(err);

        console.error("Error creating report:", errorMessage);
        throw err;
      }
    },
    isCreating: isMutating,
  };
};
