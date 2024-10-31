"use client";

import React from "react";
import useSWR from "swr";
import { Pagination, Card, CardBody, Chip, Link } from "@nextui-org/react";

import { AllJobsPageResponse } from "@/app/api/job/route";
import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { DBTable } from "@/lib/constants/dbTables";
import { formatHowLongAgo, isRecentDate } from "@/lib/formatDateUtils";
import ImageWithFallback from "@/components/ImageWithFallback";

export type AllJobsPageData = Pick<JobPostingTable, "id" | "title" | "country" | "updated_at" | "job_posted_date"> & {
  [DBTable.COMPANY]: Pick<CompanyTable, "company_name" | "logo_url">;
};

type AllJobSearchResultProps = {
  search: string;
  page: number;
  onPageChange: (newPage: number) => void;
};

export default function AllJobSearchResult({ search, page, onPageChange }: AllJobSearchResultProps) {
  const debouncedSearch = useDebounce(search);

  const { data, error, isLoading } = useSWR<AllJobsPageResponse>(API.JOB_POSTING.getAll({ page, search: debouncedSearch }), fetcher);

  const { data: jobs = [] as AllJobsPageData[], totalPages = 1 } = data || {};

  const handleJobClick = (jobId: string) => {
    // router.push(`/job/${jobId}`);
  };

  console.log("jobs", jobs);

  if (error) return <div>Failed to load jobs</div>;
  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col gap-4">
      {jobs.length === 0 && (
        <Card className="p-4">
          <p className="text-default-500">No jobs found matching your search criteria</p>
        </Card>
      )}

      {jobs.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <Card key={job.id} isPressable as={Link} className="bg-background/60 hover:bg-default-100 dark:bg-default-100/50" href={`/job/${job.id}`} onPress={() => handleJobClick(job.id)}>
                <CardBody className="p-4">
                  <div className="flex gap-4">
                    {/* Company Logo */}
                    <div className="flex-shrink-0">
                      <ImageWithFallback className="h-16 w-16 rounded-lg object-contain p-1" companyName={job.company.company_name} src={job.company.logo_url} />
                    </div>

                    {/* Job Details */}
                    <div className="flex flex-1 flex-col gap-2">
                      {/* Title Row with New Badge and Time */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-default-800">{job.title}</p>
                          {job.job_posted_date && isRecentDate(job.job_posted_date) && (
                            <Chip color="success" size="sm" variant="flat">
                              New
                            </Chip>
                          )}
                        </div>
                        {/* Posting Time */}
                        <div className="flex items-center gap-1 whitespace-nowrap text-small text-default-500">
                          {/* <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                          </svg> */}
                          <span>{formatHowLongAgo(job.updated_at)}</span>
                        </div>
                      </div>

                      {/* Company Name */}
                      <p className="text-medium font-normal text-default-500">{job.company.company_name}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-center">
            <Pagination showControls initialPage={1} page={page} total={totalPages} onChange={onPageChange} />
          </div>

          {/* Attribution */}
          <div className="mt-6 text-center">
            <a className="text-xs text-default-400" href="https://logo.dev" rel="noreferrer" target="_blank">
              Logos provided by Logo.dev
            </a>
          </div>
        </>
      )}
    </div>
  );
}
