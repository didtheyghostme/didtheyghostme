// AllJobs.tsx
"use client";

import React from "react";
import useSWR from "swr";
import { Pagination, Card, CardBody, CardHeader } from "@nextui-org/react";
import { useRouter } from "next/navigation";

import { AllJobsPageResponse } from "../api/job/route";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { DBTable } from "@/lib/constants/dbTables";

export type AllJobsPageData = Pick<JobPostingTable, "id" | "title" | "country"> & {
  [DBTable.COMPANY]: Pick<CompanyTable, "company_name">;
};

type AllJobSearchResultProps = {
  search: string;
  page: number;
  onPageChange: (newPage: number) => void;
};

export default function AllJobSearchResult({ search, page, onPageChange }: AllJobSearchResultProps) {
  const debouncedSearch = useDebounce(search);
  const router = useRouter();

  const { data, error, isLoading } = useSWR<AllJobsPageResponse>(API.JOB_POSTING.getAll({ page, search: debouncedSearch }), fetcher);

  const { data: jobs = [] as AllJobsPageData[], totalPages = 1 } = data || {};

  const handleJobClick = (jobId: string) => {
    router.push(`/job/${jobId}`);
  };

  if (error) return <div>Failed to load jobs</div>;
  if (isLoading) return <div>Loading...</div>;

  return (
    <>
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
          <div className="flex justify-end">
            <Pagination initialPage={1} page={page} total={totalPages} onChange={onPageChange} />
          </div>
        </>
      )}
    </>
  );
}
