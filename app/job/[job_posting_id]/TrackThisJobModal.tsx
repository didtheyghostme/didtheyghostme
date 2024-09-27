import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { DatePicker } from "@nextui-org/react";
import { CalendarDate, getLocalTimeZone, today, toZoned } from "@internationalized/date";

type TrackThisJobModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appliedDate: string) => void;
};

export default function TrackThisJobModal({ isOpen, onClose, onSubmit }: TrackThisJobModalProps) {
  const [appliedDate, setAppliedDate] = useState<CalendarDate>(today(getLocalTimeZone()));

  const handleSubmit = () => {
    const utcDate = toZoned(appliedDate, "UTC").toAbsoluteString();

    onSubmit(utcDate);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>When did you apply for this job?</ModalHeader>
        <ModalBody>
          <DatePicker label="Application Date" value={appliedDate} onChange={(date: CalendarDate) => setAppliedDate(date)} />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            Track Job
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
