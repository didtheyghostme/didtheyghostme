import useSWRMutation from "swr/mutation";
import { mutate } from "swr";

import { API } from "@/lib/constants/apiRoutes";
import { InterviewExperienceFormValues } from "@/lib/schema/updateInterviewRoundSchema";
import actionUpdateApplicationAndInterviewRounds from "@/app/actions/updateApplicationAndInterviewRounds";

export const useUpdateApplicationAndInterviewRounds = (application_id: string) => {
  const { trigger, isMutating } = useSWRMutation(API.INTERVIEW.getAllByApplicationId(application_id), actionUpdateApplicationAndInterviewRounds);

  return {
    updateApplicationAndInterviewRounds: async (data: InterviewExperienceFormValues) => {
      try {
        await trigger({
          ...data,
          application_id,
        });

        mutate(API.APPLICATION.getByApplicationId(application_id));
      } catch (err) {
        console.error("Error updating application and interview rounds:", err);
        throw err;
      }
    },
    isUpdating: isMutating,
  };
};
