// hooks/useCreateNote.ts
import useSWRMutation from "swr/mutation";

import actionCreateCompany from "@/app/actions/createCompany";
import { getErrorMessage } from "@/lib/errorHandling";
import { CompanyFormData } from "@/lib/schema/addCompanySchema";
import { API } from "@/lib/constants/apiRoutes";

const useCreateCompany = () => {
  const { trigger, isMutating } = useSWRMutation(API.COMPANY.getAll, actionCreateCompany);

  return {
    createCompany: async (newCompany: CompanyFormData) => {
      try {
        const result = await trigger(newCompany);

        return result;
      } catch (err) {
        const errorMessage = getErrorMessage(err);

        console.error("Error creating company:", errorMessage);
        throw err; // Re-throw the error so it can be caught in the component
      }
    },
    isCreating: isMutating,
  };
};

export { useCreateCompany };
