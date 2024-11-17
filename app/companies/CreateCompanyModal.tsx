import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input } from "@nextui-org/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useEffect } from "react";
import mixpanel from "mixpanel-browser";

import { useCreateCompany } from "@/lib/hooks/useCreateCompany";
import { ERROR_MESSAGES, getErrorMessage, isRateLimitError } from "@/lib/errorHandling";
import { CompanyFormData, companySchema } from "@/lib/schema/addCompanySchema";
import { CustomButton } from "@/components/CustomButton";

type CreateCompanyModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateCompanyModal({ isOpen, onClose }: CreateCompanyModalProps) {
  const { createCompany, isCreating } = useCreateCompany();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setFocus,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    if (isOpen) {
      setFocus("company_name");
    }
  }, [isOpen, setFocus]);

  const onSubmit = async (data: CompanyFormData) => {
    try {
      await createCompany(data);

      mixpanel.track("Company Added Success", {
        company_name: data.company_name,
        company_url: data.company_url,
      });

      toast.success("Company created successfully");

      reset();
      onClose();
    } catch (error) {
      console.error("Error creating company:", getErrorMessage(error));

      if (isRateLimitError(error)) {
        toast.error(ERROR_MESSAGES.TOO_MANY_REQUESTS);

        return; // Return early to avoid showing generic error
      }

      mixpanel.track("Company Added Error", {
        company_name: data.company_name,
        company_url: data.company_url,
        error: getErrorMessage(error),
      });

      toast.error("Error creating company", {
        description: getErrorMessage(error),
        cancel: {
          label: "X",
          onClick: () => toast.dismiss(),
        },
        cancelButtonStyle: {
          color: "inherit",
          backgroundColor: "inherit",
        },
      });
    }
  };

  return (
    <Modal isOpen={isOpen} placement="center" onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Add New Company</ModalHeader>
          <ModalBody>
            <Input {...register("company_name")} isClearable isRequired errorMessage={errors.company_name?.message} isInvalid={!!errors.company_name} label="Enter Company Name" />
            <Input {...register("company_url")} isClearable isRequired errorMessage={errors.company_url?.message} isInvalid={!!errors.company_url} label="Enter URL (e.g. https://www.google.com)" />
          </ModalBody>
          <ModalFooter>
            <CustomButton color="danger" variant="light" onPress={onClose}>
              Cancel
            </CustomButton>
            <CustomButton color="primary" isLoading={isCreating} type="submit">
              Create Company
            </CustomButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
