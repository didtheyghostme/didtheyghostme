"use client";

import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import mixpanel from "mixpanel-browser";

import AllJobsSearchInput from "./AllJobSearchInput";
import AllJobsSearchResult from "./AllJobSearchResult";

export default function AllJobSearch() {
  const [{ page, search }, setQueryStates] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault(""),
  });

  // Handlers
  const handleSearchChange = (newSearch: string) => {
    mixpanel.track("All Jobs Search", {
      action: "search_input_changed",
      search_query: newSearch,
    });
    setQueryStates({ search: newSearch, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    mixpanel.track("All Jobs Search", {
      action: "page_changed",
      previous_page: page,
      page_number: newPage,
      current_search_query: search,
    });
    setQueryStates({ page: newPage });
  };

  return (
    <>
      <AllJobsSearchInput search={search} onSearchChange={handleSearchChange} />
      <AllJobsSearchResult page={page} search={search} onPageChange={handlePageChange} />
    </>
  );
}
