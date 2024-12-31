import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input } from "@nextui-org/react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import mixpanel from "mixpanel-browser";

import { useCreateReportAdmin } from "@/lib/hooks/useCreateReportAdmin";
import { suggestLinkSchema, type SuggestLinkFormValues } from "@/lib/schema/suggestLinkSchema";
import { ERROR_MESSAGES } from "@/lib/errorHandling";
import { isRateLimitError } from "@/lib/errorHandling";
import { CustomButton } from "@/components/CustomButton";

type SuggestLinkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobStatus: JobStatus;
};

export function SuggestLinkModal({ isOpen, onClose, jobId, jobStatus }: SuggestLinkModalProps) {
  const { createReportAdmin, isCreating } = useCreateReportAdmin();

  const { control, handleSubmit } = useForm<SuggestLinkFormValues>({
    resolver: zodResolver(suggestLinkSchema),
    defaultValues: {
      url: "",
    },
  });

  const onSubmit = async (data: SuggestLinkFormValues) => {
    try {
      mixpanel.track("Suggest Link Modal submitted", {
        action: "suggest_link_submitted",
        report_message: `status_${jobStatus}: ${data.url}`,
      });

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
            <CustomButton color="danger" variant="light" onPress={onClose}>
              Cancel
            </CustomButton>
            <CustomButton color="primary" isLoading={isCreating} type="submit">
              Submit
            </CustomButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
