// hooks/useCreateNote.ts
import useSWRMutation from "swr/mutation";

import actionCreateCompany from "@/app/actions/createCompany";
import { CompanyFormData } from "@/lib/schema/addCompanySchema";
import { API } from "@/lib/constants/apiRoutes";

const useCreateCompany = () => {
  const { trigger, isMutating } = useSWRMutation(API.COMPANY.getAll, actionCreateCompany);

  return {
    createCompany: async (newCompany: CompanyFormData) => {
      const result = await trigger(newCompany);

      if (!result.isSuccess) {
        throw new Error(result.error);
      }

      return result.data;
    },
    isCreating: isMutating,
  };
};

export { useCreateCompany };
