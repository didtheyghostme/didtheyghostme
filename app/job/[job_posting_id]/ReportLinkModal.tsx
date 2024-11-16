import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, RadioGroup, Radio, Input, Textarea } from "@nextui-org/react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateReportAdmin } from "@/lib/hooks/useCreateReportAdmin";
import { REPORT_LINK_TYPES, reportLinkSchema, type ReportLinkFormValues } from "@/lib/schema/reportLinkSchema";
import { isRateLimitError } from "@/lib/errorHandling";
import { ERROR_MESSAGES } from "@/lib/errorHandling";
import { CustomButton } from "@/components/CustomButton";

type ReportLinkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobStatus: JobStatus;
};

export function ReportLinkModal({ isOpen, onClose, jobId, jobStatus }: ReportLinkModalProps) {
  const { createReportAdmin, isCreating } = useCreateReportAdmin();

  const { control, watch, handleSubmit, reset } = useForm<ReportLinkFormValues>({
    resolver: zodResolver(reportLinkSchema),
    defaultValues: {
      report_type: "Link Expired",
      url: null,
      report_message: null,
    },
  });

  const reportType = watch("report_type");

  const onSubmit = async (data: ReportLinkFormValues) => {
    try {
      await createReportAdmin({
        entity_type: "job_posting",
        entity_id: jobId,
        report_type: data.report_type,
        report_message: data.report_type === "Other" ? `status_${jobStatus}: ${data.report_message}` : `status_${jobStatus}: ${data.url || "http://localhost:3000/job/" + jobId}`,
      });
      toast.success("Report submitted successfully");
      reset();
      onClose();
    } catch (error) {
      console.error("Error reporting link:", error);
      if (isRateLimitError(error)) {
        toast.error(ERROR_MESSAGES.TOO_MANY_REQUESTS);

        return; // Return early to avoid showing generic error
      }
      toast.error("Error reporting link");
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Report job issue</ModalHeader>
          <ModalBody className="gap-4">
            <Controller
              control={control}
              name="report_type"
              render={({ field }) => (
                <RadioGroup {...field} label="What's wrong with the job posting?" orientation="vertical">
                  <Radio value={REPORT_LINK_TYPES["Link Expired"]}>Link is expired</Radio>
                  <Radio value={REPORT_LINK_TYPES["Invalid Link"]}>Link is invalid</Radio>
                  <Radio value={REPORT_LINK_TYPES["Other"]}>Other issue</Radio>
                </RadioGroup>
              )}
            />
            {reportType === "Invalid Link" && (
              <Controller
                control={control}
                name="url"
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Correct job posting URL (optional)"
                    placeholder="e.g. https://www.google.com"
                    value={field.value ?? ""}
                    variant="bordered"
                    onChange={(e) => {
                      const value = e.target.value.trim();

                      field.onChange(value === "" ? null : value);
                    }}
                  />
                )}
              />
            )}

            {reportType === "Other" && (
              <Controller
                control={control}
                name="report_message"
                render={({ field, fieldState }) => (
                  <Textarea
                    {...field}
                    isRequired
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Description"
                    placeholder="e.g. job title/company name incorrect etc."
                    value={field.value ?? ""}
                    variant="bordered"
                    onChange={(e) => {
                      const value = e.target.value;

                      field.onChange(value === "" ? null : value);
                    }}
                  />
                )}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <CustomButton color="danger" variant="light" onPress={onClose}>
              Cancel
            </CustomButton>
            <CustomButton color="primary" isLoading={isCreating} type="submit">
              Report
            </CustomButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
