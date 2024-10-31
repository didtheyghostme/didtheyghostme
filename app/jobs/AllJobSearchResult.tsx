"use client";

import React from "react";
import useSWR from "swr";
import { Pagination, Card, CardBody, CardHeader, Chip, Link } from "@nextui-org/react";

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
    <>
      <ImageWithFallback className="h-12 w-12" companyName="Seagate" src={"https://sg.linkedin.com/jobs/software-engineering-intern-jobs/"} />

      {jobs.length === 0 && <div>No jobs found</div>}

      {jobs.length > 0 && (
        <>
          <div className="mb-4 flex flex-col gap-4">
            {jobs.map((job) => (
              <Card key={job.id} isPressable as={Link} className="w-full" href={`/job/${job.id}`} onPress={() => handleJobClick(job.id)}>
                <CardHeader className="flex flex-col items-start gap-1">
                  {/* first row */}
                  <div className="flex w-full items-start justify-between">
                    <p className="text-start text-base font-semibold sm:text-lg">{job.title}</p>
                    <div className="flex items-center gap-2">
                      {job.job_posted_date && isRecentDate(job.job_posted_date) && (
                        <Chip color="success" size="sm" variant="flat">
                          New
                        </Chip>
                      )}
                      <span className="whitespace-nowrap text-small text-default-500">{formatHowLongAgo(job.updated_at)}</span>
                    </div>
                  </div>
                  {/* second row */}
                  <p className="text-small text-default-500">{job.company.company_name}</p>
                </CardHeader>
                <CardBody>
                  <ImageWithFallback className="h-12 w-12" companyName={job.company.company_name} src={job.company.logo_url} />

                  <p>{job.country}</p>
                </CardBody>
              </Card>
            ))}
          </div>
          <div className="flex justify-end">
            <Pagination initialPage={1} page={page} total={totalPages} onChange={onPageChange} />
          </div>

          <div className="mt-2">
            <a className="text-xs" href="https://logo.dev" rel="noreferrer" target="_blank">
              Logos provided by Logo.dev
            </a>
          </div>
        </>
      )}
    </>
  );
}
