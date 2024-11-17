import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, DropdownItem, DropdownMenu, DropdownTrigger, Dropdown } from "@nextui-org/react";
import { useState } from "react";

import { CountryFilter } from "./CountryFilter";
import { VerifiedJobsToggle } from "./VerifiedJobsToggle";
import { JobSortOrderKey } from "./AllJobSearch";

import { CustomButton } from "@/components/CustomButton";
import { AvailableCountry } from "@/app/api/country/available/route";
import { ChevronDownIcon } from "@/components/icons";

const sortOptions = [
  { key: "DESC", label: "Posted Date: Newest to Oldest" },
  { key: "ASC", label: "Posted Date: Oldest to Newest" },
] as const satisfies { key: JobSortOrderKey; label: string }[];

type JobFiltersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  availableCountries: AvailableCountry[];
  isLoading: boolean;
  isVerified: boolean;
  onVerifiedChange: (isVerified: boolean) => void;
  sortOrder: JobSortOrderKey;
  onSortChange: (newOrder: JobSortOrderKey) => void;
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
  sortOrder: initialSortOrder,
  onSortChange,
}: JobFiltersModalProps) {
  // Local state for temporary changes
  const [tempCountries, setTempCountries] = useState(initialCountries);
  const [tempVerified, setTempVerified] = useState(initialVerified);
  const [tempSortOrder, setTempSortOrder] = useState(initialSortOrder);

  const isApplyDisabled = tempCountries.length === 0;

  const handleClose = () => {
    // Reset to initial values when closing without applying
    setTempCountries(initialCountries);
    setTempVerified(initialVerified);
    setTempSortOrder(initialSortOrder);
    onClose();
  };

  // Apply changes when Done is clicked
  const handleDone = () => {
    onCountriesChange(tempCountries);
    onVerifiedChange(tempVerified);

    if (tempSortOrder !== initialSortOrder) {
      onSortChange(tempSortOrder);
    }
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

              <div className="space-y-2">
                <p className="text-sm font-medium">Sort By</p>
                <Dropdown>
                  <DropdownTrigger>
                    <CustomButton className="w-full justify-between" endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                      {sortOptions.find((option) => option.key === tempSortOrder)?.label || "Sort by"}
                    </CustomButton>
                  </DropdownTrigger>
                  <DropdownMenu
                    disallowEmptySelection
                    aria-label="Sort options"
                    selectedKeys={new Set([tempSortOrder])}
                    selectionMode="single"
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as JobSortOrderKey;

                      setTempSortOrder(selectedKey);
                    }}
                  >
                    {sortOptions.map((option) => (
                      <DropdownItem key={option.key}>{option.label}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
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
