import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { useState } from "react";

import { CountryFilter } from "./CountryFilter";
import { VerifiedJobsToggle } from "./VerifiedJobsToggle";

import { CustomButton } from "@/components/CustomButton";
import { AvailableCountry } from "@/app/api/country/available/route";

type JobFiltersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  availableCountries: AvailableCountry[];
  isLoading: boolean;
  isVerified: boolean;
  onVerifiedChange: (isVerified: boolean) => void;
};

export function JobFiltersModal({
  isOpen,
  onClose,
  selectedCountries: initialCountries,
  onCountriesChange,
  availableCountries,
  isLoading,
  isVerified: initialVerified,
  onVerifiedChange,
}: JobFiltersModalProps) {
  // Local state for temporary changes
  const [tempCountries, setTempCountries] = useState(initialCountries);
  const [tempVerified, setTempVerified] = useState(initialVerified);

  const isApplyDisabled = tempCountries.length === 0;

  const handleClose = () => {
    // Reset to initial values when closing without applying
    setTempCountries(initialCountries);
    setTempVerified(initialVerified);
    onClose();
  };

  // Apply changes when Done is clicked
  const handleDone = () => {
    onCountriesChange(tempCountries);
    onVerifiedChange(tempVerified);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Filter Jobs</ModalHeader>
            <ModalBody className="gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">Countries</p>
                <CountryFilter availableCountries={availableCountries} isLoading={isLoading} selectedCountries={tempCountries} onCountriesChange={setTempCountries} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Job Status</p>
                <VerifiedJobsToggle isVerified={tempVerified} onVerifiedChange={setTempVerified} />
              </div>
            </ModalBody>
            <ModalFooter>
              <CustomButton className="mr-2" variant="flat" onPress={onClose}>
                Cancel
              </CustomButton>
              <CustomButton color="primary" isDisabled={isApplyDisabled} onPress={handleDone}>
                {isApplyDisabled ? "Select at least one country" : "Apply Filters"}
              </CustomButton>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
