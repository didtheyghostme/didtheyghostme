import useSWRMutation from "swr/mutation";

import { API } from "@/lib/constants/apiRoutes";
import actionUpdateUserPreferences from "@/app/actions/updateUserPreferences";
import { UpdateUserPreferenceFormValues } from "@/lib/schema/updateUserPreferenceSchema";

export const useUpdateUserPreferences = () => {
  const { trigger, isMutating } = useSWRMutation(API.PROTECTED.getSettings, actionUpdateUserPreferences);

  return {
    updateUserPreferences: async (updates: UpdateUserPreferenceFormValues) => {
      try {
        await trigger(updates);
      } catch (err) {
        console.error("Error updating user preferences:", err);
        throw err;
      }
    },
    isUpdating: isMutating,
  };
};
