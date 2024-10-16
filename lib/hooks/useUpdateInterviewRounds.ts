import useSWRMutation from "swr/mutation";

import { API } from "@/lib/constants/apiRoutes";
import actionUpdateInterviewRounds, { UpdateInterviewRoundsArgs } from "@/app/actions/updateInterviewRounds";

export const useUpdateInterviewRounds = (application_id: string) => {
  const { trigger, isMutating } = useSWRMutation(API.INTERVIEW.getByApplicationId(application_id), actionUpdateInterviewRounds);

  return {
    updateInterviewRounds: async (interviewRounds: UpdateInterviewRoundsArgs["interviewRounds"]) => {
      try {
        const result = await trigger({ application_id, interviewRounds });

        return result;
      } catch (err) {
        console.error("Error updating interview rounds:", err);
        throw err;
      }
    },
    isUpdatingInterviewRounds: isMutating,
  };
};
