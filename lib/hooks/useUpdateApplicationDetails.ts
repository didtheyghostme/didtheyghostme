import useSWRMutation from "swr/mutation";

import { API } from "@/lib/constants/apiRoutes";
import actionUpdateApplicationDetails, { ClientUpdateApplicationArgs } from "@/app/actions/updateApplicationDetails";

export const useUpdateApplicationDetails = (application_id: string) => {
  const { trigger, isMutating } = useSWRMutation(API.APPLICATION.getByApplicationId(application_id), actionUpdateApplicationDetails);

  return {
    updateApplicationDetails: async (args: ClientUpdateApplicationArgs) => {
      try {
        const result = await trigger({ id: application_id, ...args });

        return result;
      } catch (err) {
        console.error("Error updating application:", err);
        throw err;
      }
    },
    isUpdating: isMutating,
  };
};
