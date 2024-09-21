// hooks/useCreateNote.ts
import useSWRMutation from "swr/mutation";

import actionCreateCompany from "@/app/actions/createCompany";
import { getErrorMessage } from "@/lib/errorHandling";
import { CompanyFormData } from "@/lib/schema/companySchema";

const useCreateCompany = () => {
  const { trigger, isMutating } = useSWRMutation("/api/company", actionCreateCompany);

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
