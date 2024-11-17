"use client";

import React, { useState } from "react";
import { Input } from "@nextui-org/react";

import { JobFiltersModal } from "./JobFiltersModal";

import { CustomButton } from "@/components/CustomButton";
import { AvailableCountry } from "@/app/api/country/available/route";
import { FilterIcon } from "@/components/icons";

type AllJobSearchInputProps = {
  search: string;
  onSearchChange: (newSearch: string) => void;
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  availableCountries: AvailableCountry[];
  isLoading: boolean;
  isVerified: boolean;
  onVerifiedChange: (isVerified: boolean) => void;
};

export function AllJobSearchInput({ search, onSearchChange, selectedCountries, onCountriesChange, availableCountries, isLoading, isVerified, onVerifiedChange }: AllJobSearchInputProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Input className="flex-1" placeholder="Search job title or company name..." value={search} onChange={(e) => onSearchChange(e.target.value)} />
        {/* Mobile: Icon only, Desktop: Icon + Text */}
        <CustomButton className="!w-14 !min-w-fit sm:!w-auto" isIconOnly={false} startContent={<FilterIcon size={20} />} variant="flat" onPress={() => setIsFilterModalOpen(true)}>
          <span className="hidden sm:inline">Filters</span>
        </CustomButton>
      </div>

      <JobFiltersModal
        availableCountries={availableCountries}
        isLoading={isLoading}
        isOpen={isFilterModalOpen}
        isVerified={isVerified}
        selectedCountries={selectedCountries}
        onClose={() => setIsFilterModalOpen(false)}
        onCountriesChange={onCountriesChange}
        onVerifiedChange={onVerifiedChange}
      />
    </>
  );
}
