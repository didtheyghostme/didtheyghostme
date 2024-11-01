import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@nextui-org/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useCreateCompany } from "@/lib/hooks/useCreateCompany";
import { getErrorMessage, isDuplicateUrlError } from "@/lib/errorHandling";
import { CompanyFormData, companySchema } from "@/lib/schema/addCompanySchema";

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
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const onSubmit = async (data: CompanyFormData) => {
    try {
      await createCompany(data);
      toast.success("Company created successfully");
      reset();
      onClose();
    } catch (error) {
      console.error("Error creating company:", getErrorMessage(error));
      if (isDuplicateUrlError(error)) {
        console.error("Duplicate company URL");
      }
      toast.error("Error creating company", { description: getErrorMessage(error) });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Add New Company</ModalHeader>
          <ModalBody>
            <Input {...register("company_name")} isClearable isRequired errorMessage={errors.company_name?.message} isInvalid={!!errors.company_name} label="Enter Company Name" />
            <Input {...register("company_url")} isClearable isRequired errorMessage={errors.company_url?.message} isInvalid={!!errors.company_url} label="Enter URL (e.g. https://www.google.com)" />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" isLoading={isCreating} type="submit">
              Create Company
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
