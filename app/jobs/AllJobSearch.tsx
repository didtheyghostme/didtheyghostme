"use client";

import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import mixpanel from "mixpanel-browser";
import { Suspense } from "react";

import { AllJobSearchInput } from "./AllJobSearchInput";
import { AllJobSearchResult } from "./AllJobSearchResult";

import { LoadingContent } from "@/components/LoadingContent";

function AllJobSearchContent() {
  const [{ search, page }, setQueryStates] = useQueryStates({
    search: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
  });

  const handleSearchChange = (newSearch: string) => {
    mixpanel.track("All Jobs Search Input", {
      action: "search_input_changed",
      search_query: newSearch,
      page,
    });
    setQueryStates({ search: newSearch, page: 1 });
  };

  return (
    <>
      <AllJobSearchInput search={search} onSearchChange={handleSearchChange} />
      <AllJobSearchResult />
    </>
  );
}

export function AllJobSearch() {
  return (
    <Suspense fallback={<LoadingContent />}>
      <AllJobSearchContent />
    </Suspense>
  );
}
