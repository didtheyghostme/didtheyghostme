"use client";

import React from "react";
import useSWR from "swr";
import { Input, Pagination, Card, CardBody, CardHeader } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { AllJobsPageResponse } from "@/app/api/job/route";
import { DBTable } from "@/lib/constants/dbTables";

export type AllJobsPageData = Pick<JobPostingTable, "id" | "title" | "country"> & {
  [DBTable.COMPANY]: Pick<CompanyTable, "company_name">;
};

export default function AllJobsPage() {
  const [{ page, search }, setQueryStates] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault(""),
  });

  const debouncedSearch = useDebounce(search);

  const { data, error, isLoading } = useSWR<AllJobsPageResponse>(API.JOB_POSTING.getAll({ page, search: debouncedSearch }), fetcher);

  console.log("data", data);

  const { data: jobs = [] as AllJobsPageData[], totalPages = 1 } = data || {};

  const router = useRouter();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryStates({ search: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setQueryStates({ page: newPage });
  };

  const handleJobClick = (jobId: string) => {
    router.push(`/job/${jobId}`);
  };

  if (error) return <div>Failed to load jobs</div>;
  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="w-full p-4">
      <h1 className="mb-4 text-2xl font-bold">All Job Postings</h1>
      <Input className="mb-4" placeholder="Search jobs..." value={search} onChange={handleSearchChange} />

      {jobs.length === 0 && <div>No jobs found</div>}

      {jobs.length > 0 && (
        <>
          <div className="mb-4 flex flex-col gap-4">
            {jobs.map((job) => (
              <Card key={job.id} isPressable className="w-full" onPress={() => handleJobClick(job.id)}>
                <CardHeader className="flex gap-3">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold">{job.title}</h2>
                    <p className="text-small text-default-500">{job.company.company_name}</p>
                  </div>
                </CardHeader>
                <CardBody>
                  <p>{job.country}</p>
                </CardBody>
              </Card>
            ))}
          </div>
          <Pagination initialPage={1} page={page} total={totalPages} onChange={handlePageChange} />
        </>
      )}
    </div>
  );
}
