import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { DatePicker } from "@nextui-org/react";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";

type TrackThisJobModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appliedDate: string) => void;
  isCreating: boolean;
};

export default function TrackThisJobModal({ isOpen, onClose, onSubmit, isCreating }: TrackThisJobModalProps) {
  const [appliedDate, setAppliedDate] = useState<CalendarDate>(today(getLocalTimeZone()));

  const handleSubmit = () => {
    onSubmit(appliedDate.toString());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>When did you apply for this job?</ModalHeader>
        <ModalBody>
          <DatePicker label="Application Date" maxValue={today(getLocalTimeZone())} value={appliedDate} onChange={(date: CalendarDate) => setAppliedDate(date)} />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" isLoading={isCreating} onPress={handleSubmit}>
            Track Job
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
