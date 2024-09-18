// hooks/useCreateNote.ts
import useSWRMutation from "swr/mutation";

import actionCreateCompany from "@/app/actions/createCompany";

const useCreateCompany = () => {
  const { trigger, isMutating } = useSWRMutation("companyKey", actionCreateCompany);

  return {
    createCompany: (newCompany: Company) => {
      trigger(newCompany);
    },
    isCreating: isMutating,
  };
};

export { useCreateCompany };
