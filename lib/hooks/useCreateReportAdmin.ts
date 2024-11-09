import useSWRMutation from "swr/mutation";

import { getErrorMessage } from "@/lib/errorHandling";
import actionCreateReportAdmin, { CreateReportAdminArgs } from "@/app/actions/createReportAdmin";
import { API } from "@/lib/constants/apiRoutes";

export const useCreateReportAdmin = () => {
  const { trigger, isMutating } = useSWRMutation(API.ADMIN.getAllReports, actionCreateReportAdmin);

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
