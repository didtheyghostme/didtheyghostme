import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";

type ReportLinkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
};

export default function ReportLinkModal({ isOpen, onClose, jobId }: ReportLinkModalProps) {
  const handleReportClick = async () => {
    // Implement the logic to report the link
    // This could be an API call to your backend
    console.log(`Reporting expired link for job ID: ${jobId}`);
    // After successful report, close the modal
    // TODO: update the job posting closed_at date with today's date (manually?), sent to report link expired database table
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
          <Button color="primary" onPress={handleReportClick}>
            Report
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
