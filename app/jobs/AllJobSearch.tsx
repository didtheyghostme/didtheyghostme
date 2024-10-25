"use client";

import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";

import AllJobsSearchInput from "./AllJobSearchInput";
import AllJobsSearchResult from "./AllJobSearchResult";

export default function AllJobSearch() {
  const [{ page, search }, setQueryStates] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault(""),
  });

  // Handlers
  const handleSearchChange = (newSearch: string) => {
    setQueryStates({ search: newSearch, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setQueryStates({ page: newPage });
  };

  return (
    <>
      <AllJobsSearchInput search={search} onSearchChange={handleSearchChange} />
      <AllJobsSearchResult page={page} search={search} onPageChange={handlePageChange} />
    </>
  );
}
