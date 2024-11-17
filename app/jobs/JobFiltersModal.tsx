import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, SelectItem, Select } from "@nextui-org/react";
import { useState } from "react";

import { CountryFilter } from "./CountryFilter";
import { VerifiedJobsToggle } from "./VerifiedJobsToggle";
import { JobSortOrderKey } from "./AllJobSearchInput";
import { ExperienceLevelFilter } from "./ExperienceLevelFilter";

import { CustomButton } from "@/components/CustomButton";
import { AvailableCountry } from "@/app/api/country/available/route";
import { ExperienceLevelSelect } from "@/app/api/experience-level/route";

const sortOptions = [
  { key: "DESC", label: "Posted Date: Newest to Oldest" },
  { key: "ASC", label: "Posted Date: Oldest to Newest" },
] satisfies { key: JobSortOrderKey; label: string }[];

type JobFiltersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  availableCountries: AvailableCountry[];
  countriesLoading: boolean;
  experienceLevelsLoading: boolean;
  isVerified: boolean;
  onVerifiedChange: (isVerified: boolean) => void;
  sortOrder: JobSortOrderKey;
  onSortChange: (newOrder: JobSortOrderKey) => void;
  selectedExperienceLevelId: string;
  onExperienceLevelChange: (experienceLevelId: string) => void;
  experienceLevels: ExperienceLevelSelect[];
};

export function JobFiltersModal({
  isOpen,
  onClose,
  selectedCountries: initialCountries,
  onCountriesChange,
  availableCountries,
  countriesLoading,
  experienceLevelsLoading,
  isVerified: initialVerified,
  onVerifiedChange,
  sortOrder: initialSortOrder,
  onSortChange,
  selectedExperienceLevelId: initialExperienceLevelId,
  onExperienceLevelChange,
  experienceLevels,
}: JobFiltersModalProps) {
  // Local state for temporary changes
  const [tempCountries, setTempCountries] = useState(initialCountries);
  const [tempVerified, setTempVerified] = useState(initialVerified);
  const [tempSortOrder, setTempSortOrder] = useState(initialSortOrder);
  const [tempExperienceLevelId, setTempExperienceLevelId] = useState(initialExperienceLevelId);

  const handleClose = () => {
    // Reset to initial values when closing without applying
    setTempCountries(initialCountries);
    setTempVerified(initialVerified);
    setTempSortOrder(initialSortOrder);
    setTempExperienceLevelId(initialExperienceLevelId);
    onClose();
  };

  // Apply changes when Done is clicked
  const handleDone = () => {
    onCountriesChange(tempCountries);
    onVerifiedChange(tempVerified);
    onSortChange(tempSortOrder);
    onExperienceLevelChange(tempExperienceLevelId);

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
                <CountryFilter availableCountries={availableCountries} countriesLoading={countriesLoading} selectedCountries={tempCountries} onCountriesChange={setTempCountries} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Job Status</p>
                <VerifiedJobsToggle isVerified={tempVerified} onVerifiedChange={setTempVerified} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Sort By</p>
                <Select
                  disallowEmptySelection
                  className="w-full"
                  items={sortOptions}
                  label="Sort by"
                  placeholder="Select sort order"
                  selectedKeys={[tempSortOrder]}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as JobSortOrderKey;

                    setTempSortOrder(selectedKey);
                  }}
                >
                  {(option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  )}
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Experience Level</p>
                <ExperienceLevelFilter
                  experienceLevels={experienceLevels}
                  experienceLevelsLoading={experienceLevelsLoading}
                  selectedExperienceLevelId={tempExperienceLevelId}
                  onExperienceLevelChange={setTempExperienceLevelId}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <CustomButton className="mr-2" variant="flat" onPress={onClose}>
                Cancel
              </CustomButton>
              <CustomButton color="primary" onPress={handleDone}>
                Apply Filters
              </CustomButton>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
