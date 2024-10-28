import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { toast } from "sonner";

import { useCreateReportAdmin } from "@/lib/hooks/useCreateReportAdmin";

type ReportLinkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
};

export default function ReportLinkModal({ isOpen, onClose, jobId }: ReportLinkModalProps) {
  const { createReportAdmin, isCreating } = useCreateReportAdmin();

  const handleReportClick = async () => {
    try {
      await createReportAdmin({
        entity_type: "job_posting",
        entity_id: jobId,
        report_type: "Link Expired",
        report_message: "http://localhost:3000/job/" + jobId,
      });
      toast.success("Report submitted successfully");
    } catch (error) {
      console.error("Error reporting expired link:", error);
      toast.error("Error reporting expired link");
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Report Expired Link</ModalHeader>
        <ModalBody>Are you sure you want to report this job portal link as expired?</ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" isLoading={isCreating} onPress={handleReportClick}>
            Report
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
