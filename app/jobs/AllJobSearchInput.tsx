"use client";

import React, { useState } from "react";
import { Input } from "@nextui-org/react";
import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
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

  const [{ isVerified, countries, sortOrder, experienceLevelIds, page }, setQueryStates] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    isVerified: parseAsBoolean.withDefault(false),
    countries: parseAsArrayOf(parseAsString).withDefault([]),
    sortOrder: parseAsStringLiteral(Object.values(SORT_ORDER_OPTIONS)).withDefault("DESC"),
    experienceLevelIds: parseAsArrayOf(parseAsString).withDefault([]),
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const handleCountriesChange = (selectedCountries: string[]) => {
    mixpanel.track("All Jobs Action", {
      action: "countries_changed",
      countries: selectedCountries,
      search: search,
      is_verified: isVerified,
      sort_order: sortOrder,
      experience_level_ids: experienceLevelIds,
      page,
    });
    setQueryStates({ countries: selectedCountries, page: 1 });
  };

  const handleVerifiedChange = (isSelected: boolean) => {
    mixpanel.track("All Jobs Action", {
      action: "verified_jobs_toggled",
      is_verified: `from ${isVerified} to ${isSelected}`,
      search: search,
      countries: countries,
      sort_order: sortOrder,
      experience_level_ids: experienceLevelIds,
      page,
    });
    setQueryStates({ isVerified: isSelected, page: 1 });
  };

  const handleSortChange = (newOrder: JobSortOrderKey) => {
    mixpanel.track("All Jobs Filter", {
      action: "sort_changed",
      sort_order: newOrder,
      search: search,
      countries: countries,
      is_verified: isVerified,
      experience_level_ids: experienceLevelIds,
      page,
    });
    setQueryStates({ sortOrder: newOrder, page: 1 });
  };

  const handleExperienceLevelChange = (newExperienceLevelIds: string[]) => {
    mixpanel.track("All Jobs Action", {
      action: "experience_level_changed",
      experience_level_ids: newExperienceLevelIds,
      search: search,
      countries: countries,
      is_verified: isVerified,
      sort_order: sortOrder,
      page,
    });
    setQueryStates({ experienceLevelIds: newExperienceLevelIds, page: 1 });
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
        selectedExperienceLevelIds={experienceLevelIds}
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
