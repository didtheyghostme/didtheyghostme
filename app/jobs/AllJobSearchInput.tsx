"use client";

import React, { useState } from "react";
import { Input } from "@nextui-org/react";
import { parseAsArrayOf, parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import useSWR from "swr";
import mixpanel from "mixpanel-browser";

import { JobFiltersModal } from "./JobFiltersModal";

import { CustomButton } from "@/components/CustomButton";
import { AvailableCountry } from "@/app/api/country/available/route";
import { FilterIcon } from "@/components/icons";
import { ExperienceLevelSelect } from "@/app/api/experience-level/route";
import { API } from "@/lib/constants/apiRoutes";
import { fetcher } from "@/lib/fetcher";

export type JobSortOrderKey = "ASC" | "DESC";

export const SORT_ORDER_OPTIONS = {
  ASC: "DESC",
  DESC: "ASC",
} satisfies Record<JobSortOrderKey, JobSortOrderKey>;

type AllJobSearchInputProps = {
  search: string;
  onSearchChange: (newSearch: string) => void;
};

export function AllJobSearchInput({ search, onSearchChange }: AllJobSearchInputProps) {
  const { data: availableCountries = [], isLoading: countriesLoading } = useSWR<AvailableCountry[]>(API.COUNTRY.getAvailable, fetcher);

  const { data: experienceLevels = [], isLoading: experienceLevelsLoading } = useSWR<ExperienceLevelSelect[]>(API.EXPERIENCE_LEVEL.getAll, fetcher);

  const [{ isVerified, countries, sortOrder, experienceLevelId }, setQueryStates] = useQueryStates({
    isVerified: parseAsBoolean.withDefault(false),
    countries: parseAsArrayOf(parseAsString).withDefault([]),
    sortOrder: parseAsStringLiteral(Object.values(SORT_ORDER_OPTIONS)).withDefault("DESC"),
    experienceLevelId: parseAsString.withDefault(""),
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const handleCountriesChange = (selectedCountries: string[]) => {
    mixpanel.track("All Jobs Action", {
      action: "countries_changed",
      countries: selectedCountries,
      search: search,
      is_verified: isVerified,
      sort_order: sortOrder,
      experience_level_id: experienceLevelId,
    });
    setQueryStates({ countries: selectedCountries });
  };

  const handleVerifiedChange = (isSelected: boolean) => {
    mixpanel.track("All Jobs Action", {
      action: "verified_jobs_toggled",
      is_verified: `from ${isVerified} to ${isSelected}`,
      search: search,
      countries: countries,
      sort_order: sortOrder,
      experience_level_id: experienceLevelId,
    });
    setQueryStates({ isVerified: isSelected });
  };

  const handleSortChange = (newOrder: JobSortOrderKey) => {
    mixpanel.track("All Jobs Filter", {
      action: "sort_changed",
      sort_order: newOrder,
      search: search,
      countries: countries,
      is_verified: isVerified,
      experience_level_id: experienceLevelId,
    });
    setQueryStates({ sortOrder: newOrder });
  };

  const handleExperienceLevelChange = (newExperienceLevelId: string) => {
    mixpanel.track("All Jobs Action", {
      action: "experience_level_changed",
      experience_level_id: newExperienceLevelId,
      search: search,
      countries: countries,
      is_verified: isVerified,
      sort_order: sortOrder,
    });
    setQueryStates({ experienceLevelId: newExperienceLevelId });
  };

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
        countriesLoading={countriesLoading}
        experienceLevels={experienceLevels}
        experienceLevelsLoading={experienceLevelsLoading}
        isOpen={isFilterModalOpen}
        isVerified={isVerified}
        selectedCountries={countries}
        selectedExperienceLevelId={experienceLevelId}
        sortOrder={sortOrder}
        onClose={() => setIsFilterModalOpen(false)}
        onCountriesChange={handleCountriesChange}
        onExperienceLevelChange={handleExperienceLevelChange}
        onSortChange={handleSortChange}
        onVerifiedChange={handleVerifiedChange}
      />
    </>
  );
}
