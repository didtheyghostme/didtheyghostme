import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@nextui-org/react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateReportAdmin } from "@/lib/hooks/useCreateReportAdmin";
import { suggestLinkSchema, type SuggestLinkFormValues } from "@/lib/schema/suggestLinkSchema";
import { ERROR_MESSAGES } from "@/lib/errorHandling";
import { isRateLimitError } from "@/lib/errorHandling";

type SuggestLinkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobStatus: JobStatus;
};

export default function SuggestLinkModal({ isOpen, onClose, jobId, jobStatus }: SuggestLinkModalProps) {
  const { createReportAdmin, isCreating } = useCreateReportAdmin();

  const { control, handleSubmit } = useForm<SuggestLinkFormValues>({
    resolver: zodResolver(suggestLinkSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = async (data: SuggestLinkFormValues) => {
    try {
      await createReportAdmin({
        entity_type: "job_posting",
        entity_id: jobId,
        report_type: "Suggest Link",
        report_message: `status_${jobStatus}: ${data.url}`,
      });
      toast.success("Link suggestion submitted successfully");
      onClose();
    } catch (error) {
      if (isRateLimitError(error)) {
        toast.error(ERROR_MESSAGES.TOO_MANY_REQUESTS);

        return; // Return early to avoid showing generic error
      }
      console.error("Error suggesting link:", error);
      toast.error("Error submitting link suggestion");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Suggest Job Portal Link</ModalHeader>
          <ModalBody>
            <Controller
              control={control}
              name="url"
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  isRequired
                  errorMessage={fieldState.error?.message}
                  isInvalid={!!fieldState.error}
                  label="Job Portal URL"
                  placeholder="Enter the job posting URL"
                  variant="bordered"
                />
              )}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" isLoading={isCreating} type="submit">
              Submit
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
