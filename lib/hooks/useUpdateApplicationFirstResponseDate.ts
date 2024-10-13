import useSWRMutation from "swr/mutation";

import { API } from "@/lib/constants/apiRoutes";
import actionUpdateApplicationFirstResponseDate from "@/app/actions/updateApplicationFirstResponseDate";

export const useUpdateApplicationFirstResponseDate = (application_id: string) => {
  const { trigger, isMutating } = useSWRMutation(API.APPLICATION.getByApplicationId(application_id), actionUpdateApplicationFirstResponseDate);

  return {
    updateApplicationFirstResponseDate: async (first_response_date: string) => {
      try {
        const result = await trigger({ id: application_id, first_response_date });

        return result;
      } catch (err) {
        console.error("Error updating application:", err);
        throw err;
      }
    },
    isUpdating: isMutating,
  };
};
