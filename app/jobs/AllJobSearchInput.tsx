"use client";

import React, { useState } from "react";
import { Input } from "@nextui-org/react";
import { createParser, parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import useSWR from "swr";
import mixpanel from "mixpanel-browser";

import { JobFiltersModal } from "./JobFiltersModal";

import { CustomButton } from "@/components/CustomButton";
import { FilterIcon } from "@/components/icons";
import { API } from "@/lib/constants/apiRoutes";
import { fetcher } from "@/lib/fetcher";
import { SettingsUserPreferencesResponse } from "@/app/api/(protected)/settings/route";

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
  // const { data: availableCountries = [], isLoading: countriesLoading } = useSWR<AvailableCountry[]>(API.COUNTRY.getAvailable, fetcher);

  // const { data: experienceLevels = [], isLoading: experienceLevelsLoading } = useSWR<ExperienceLevelSelect[]>(API.EXPERIENCE_LEVEL.getAll, fetcher);

  // const { data: jobCategories = [], isLoading: jobCategoriesLoading } = useSWR<JobCategorySelect[]>(API.JOB_CATEGORY.getAll, fetcher);

  const {
    data: settingsPreferences = {
      available_countries: [],
      all_experience_levels: [],
      all_job_categories: [],
      default_countries: [],
      default_experience_levels: [],
      default_job_categories: [],
    } as SettingsUserPreferencesResponse,
    isLoading,
  } = useSWR<SettingsUserPreferencesResponse>(API.PROTECTED.getSettings, fetcher);

  // console.warn("settingsPreferences", settingsPreferences);

  const parseAsJobCategory = createParser({
    parse: (value: string): JobCategoryName | null => {
      if (!settingsPreferences.all_job_categories.includes(value as JobCategoryName)) {
        mixpanel.track("All Jobs Filter invalid job category", {
          job_category: value,
        });
      }

      return settingsPreferences.all_job_categories.includes(value as JobCategoryName) ? (value as JobCategoryName) : null;
    },
    serialize: (value: JobCategoryName): string => value,
  });

  const parseAsExperienceLevel = createParser({
    parse: (value: string): ExperienceLevel | null => {
      if (!settingsPreferences.all_experience_levels.includes(value as ExperienceLevel)) {
        mixpanel.track("All Jobs Filter invalid experience level", {
          experience_level: value,
        });
      }

      return settingsPreferences.all_experience_levels.includes(value as ExperienceLevel) ? (value as ExperienceLevel) : null;
    },
    serialize: (value: ExperienceLevel): string => value,
  });

  const [{ isVerified, countries, sortOrder, experienceLevelNames, page, jobCategoryNames }, setQueryStates] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    isVerified: parseAsBoolean.withDefault(false),
    countries: parseAsArrayOf(parseAsString).withDefault([]),
    sortOrder: parseAsStringLiteral(Object.values(SORT_ORDER_OPTIONS)).withDefault("DESC"),
    experienceLevelNames: parseAsArrayOf(parseAsExperienceLevel).withDefault([]),
    jobCategoryNames: parseAsArrayOf(parseAsJobCategory).withDefault([]),
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const handleCountriesChange = (selectedCountries: string[]) => {
    mixpanel.track("All Jobs Action", {
      action: "countries_changed",
      countries: selectedCountries,
      search: search,
      is_verified: isVerified,
      sort_order: sortOrder,
      experience_level_names: experienceLevelNames,
      page,
      job_category_names: jobCategoryNames,
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
      experience_level_names: experienceLevelNames,
      page,
      job_category_names: jobCategoryNames,
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
      experience_level_names: experienceLevelNames,
      page,
      job_category_names: jobCategoryNames,
    });
    setQueryStates({ sortOrder: newOrder, page: 1 });
  };

  const handleExperienceLevelChange = (newExperienceLevelNames: ExperienceLevel[]) => {
    mixpanel.track("All Jobs Action", {
      action: "experience_level_changed",
      experience_level_names: newExperienceLevelNames,
      search: search,
      countries: countries,
      is_verified: isVerified,
      sort_order: sortOrder,
      page,
      job_category_names: jobCategoryNames,
    });
    setQueryStates({ experienceLevelNames: newExperienceLevelNames, page: 1 });
  };

  const handleJobCategoryChange = (newJobCategoryNames: JobCategoryName[]) => {
    mixpanel.track("All Jobs Action", {
      action: "job_category_changed",
      job_category_names: newJobCategoryNames,
      search,
      countries,
      is_verified: isVerified,
      sort_order: sortOrder,
      experience_level_names: experienceLevelNames,
      page,
    });
    setQueryStates({ jobCategoryNames: newJobCategoryNames, page: 1 });
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

      {isFilterModalOpen && !isLoading && (
        <JobFiltersModal
          availableCountries={settingsPreferences.available_countries}
          experienceLevels={settingsPreferences.all_experience_levels}
          isOpen={isFilterModalOpen}
          isVerified={isVerified}
          jobCategories={settingsPreferences.all_job_categories}
          selectedCountries={countries.length > 0 ? countries : settingsPreferences.default_countries}
          selectedExperienceLevelNames={experienceLevelNames.length > 0 ? experienceLevelNames : settingsPreferences.default_experience_levels}
          selectedJobCategoryNames={jobCategoryNames.length > 0 ? jobCategoryNames : settingsPreferences.default_job_categories}
          sortOrder={sortOrder}
          onClose={() => setIsFilterModalOpen(false)}
          onCountriesChange={handleCountriesChange}
          onExperienceLevelChange={handleExperienceLevelChange}
          onJobCategoryChange={handleJobCategoryChange}
          onSortChange={handleSortChange}
          onVerifiedChange={handleVerifiedChange}
        />
      )}
    </>
  );
}
