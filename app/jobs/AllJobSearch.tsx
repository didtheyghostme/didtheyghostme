"use client";

import { useQueryStates, parseAsInteger, parseAsString, parseAsBoolean, parseAsArrayOf, parseAsStringLiteral } from "nuqs";
import mixpanel from "mixpanel-browser";
import useSWR from "swr";

import { AllJobSearchInput } from "./AllJobSearchInput";
import { AllJobSearchResult } from "./AllJobSearchResult";

import { API } from "@/lib/constants/apiRoutes";
import { fetcher } from "@/lib/fetcher";
import { AvailableCountry } from "@/app/api/country/available/route";

export type JobSortOrderKey = "ASC" | "DESC";

const SORT_ORDER_OPTIONS = {
  ASC: "DESC",
  DESC: "ASC",
} satisfies Record<JobSortOrderKey, JobSortOrderKey>;

const SINGAPORE_ID = process.env.NEXT_PUBLIC_SINGAPORE_ID || "9405f0d7-d689-4838-956d-d99467dd48d2";

export function AllJobSearch() {
  const { data: availableCountries = [], isLoading } = useSWR<AvailableCountry[]>(API.COUNTRY.getAvailable, fetcher);

  const [{ page, search, isVerified, countries, sortOrder }, setQueryStates] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault(""),
    isVerified: parseAsBoolean.withDefault(false),
    countries: parseAsArrayOf(parseAsString).withDefault([SINGAPORE_ID]),
    sortOrder: parseAsStringLiteral(Object.values(SORT_ORDER_OPTIONS)).withDefault("DESC"),
  });

  // Handlers
  const handleSearchChange = (newSearch: string) => {
    mixpanel.track("All Jobs Search Input", {
      action: "search_input_changed",
      page_number: page,
      search_query: newSearch,
      is_verified: isVerified,
      sort_order: sortOrder,
      countries: countries,
    });
    setQueryStates({ search: newSearch, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    mixpanel.track("All Jobs Action", {
      action: "page_changed",
      previous_page: page,
      page_number: newPage,
      current_search_query: search,
      is_verified: isVerified,
      sort_order: sortOrder,
      countries: countries,
    });
    setQueryStates({ page: newPage });
  };

  const handleCountriesChange = (selectedCountries: string[]) => {
    mixpanel.track("All Jobs Action", {
      action: "countries_changed",
      countries: selectedCountries,
      search_query: search,
      is_verified: isVerified,
      sort_order: sortOrder,
    });

    setQueryStates({
      countries: selectedCountries,
      page: 1,
    });
  };

  const handleVerifiedChange = (isSelected: boolean) => {
    mixpanel.track("All Jobs Action", {
      action: "verified_jobs_toggled",
      page_number: page,
      search_query: search,
      is_verified: `from ${isVerified} to ${isSelected}`,
      countries: countries,
      sort_order: sortOrder,
    });
    setQueryStates({ isVerified: isSelected, page: 1 });
  };

  const handleSortChange = (newOrder: JobSortOrderKey) => {
    mixpanel.track("All Jobs Filter", {
      action: "sort_changed",
      sort_order: newOrder,
      search_query: search,
      is_verified: isVerified,
      countries: countries,
    });
    setQueryStates({ sortOrder: newOrder, page: 1 });
  };

  return (
    <>
      <AllJobSearchInput
        availableCountries={availableCountries}
        isLoading={isLoading}
        isVerified={isVerified}
        search={search}
        selectedCountries={countries}
        sortOrder={sortOrder}
        onCountriesChange={handleCountriesChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onVerifiedChange={handleVerifiedChange}
      />
      <AllJobSearchResult isVerified={isVerified} page={page} search={search} selectedCountries={countries} sortOrder={sortOrder} onPageChange={handlePageChange} />
    </>
  );
}
