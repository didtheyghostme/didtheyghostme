"use client";

import { useQueryStates, parseAsInteger, parseAsString, parseAsBoolean } from "nuqs";
import mixpanel from "mixpanel-browser";

import AllJobsSearchInput from "./AllJobSearchInput";
import AllJobsSearchResult from "./AllJobSearchResult";

export default function AllJobSearch() {
  const [{ page, search, isVerified }, setQueryStates] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault(""),
    isVerified: parseAsBoolean.withDefault(false),
  });

  // Handlers
  const handleSearchChange = (newSearch: string) => {
    mixpanel.track("All Jobs Search Input", {
      action: "search_input_changed",
      page_number: page,
      search_query: newSearch,
      is_verified: isVerified,
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
    });
    setQueryStates({ page: newPage });
  };

  return (
    <>
      <AllJobsSearchInput search={search} onSearchChange={handleSearchChange} />
      <AllJobsSearchResult isVerified={isVerified} page={page} search={search} onPageChange={handlePageChange} />
    </>
  );
}
