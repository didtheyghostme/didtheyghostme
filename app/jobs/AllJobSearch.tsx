"use client";

import { useQueryStates, parseAsString } from "nuqs";
import mixpanel from "mixpanel-browser";

import { AllJobSearchInput } from "./AllJobSearchInput";
import { AllJobSearchResult } from "./AllJobSearchResult";

export function AllJobSearch() {
  const [{ search }, setQueryStates] = useQueryStates({
    search: parseAsString.withDefault(""),
  });

  const handleSearchChange = (newSearch: string) => {
    mixpanel.track("All Jobs Search Input", {
      action: "search_input_changed",
      search_query: newSearch,
    });
    setQueryStates({ search: newSearch });
  };

  return (
    <>
      <AllJobSearchInput search={search} onSearchChange={handleSearchChange} />
      <AllJobSearchResult />
    </>
  );
}
