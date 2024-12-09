import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { DatePicker } from "@nextui-org/react";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";

import { CustomButton } from "@/components/CustomButton";

type TrackThisJobModalProps = {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (appliedDate: string) => void;
};

export function TrackThisJobModal({ isOpen, isLoading, onClose, onSubmit }: TrackThisJobModalProps) {
  const [appliedDate, setAppliedDate] = useState<CalendarDate>(today(getLocalTimeZone()));

  const handleSubmit = () => {
    if (isLoading) return;

    onSubmit(appliedDate.toString());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>When did you apply for this job?</ModalHeader>
        <ModalBody>
          <DatePicker label="Application Date" maxValue={today(getLocalTimeZone())} value={appliedDate} onChange={(date) => date && setAppliedDate(date)} />
        </ModalBody>
        <ModalFooter>
          <CustomButton color="danger" variant="light" onPress={onClose}>
            Cancel
          </CustomButton>
          <CustomButton color="primary" isLoading={isLoading} onPress={handleSubmit}>
            Track Job
          </CustomButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
