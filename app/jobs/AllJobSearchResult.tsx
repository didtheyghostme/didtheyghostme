"use client";

import React from "react";
import useSWR from "swr";
import { Pagination, Card, CardBody } from "@heroui/react";
import { useQueryStates } from "nuqs";
import mixpanel from "mixpanel-browser";
import NextLink from "next/link";

import { AllJobsPageResponse } from "@/app/api/job/route";
import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { DBTable } from "@/lib/constants/dbTables";
import { formatHowLongAgo, isRecentDate, formatClosingDate } from "@/lib/formatDateUtils";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { isRateLimitError } from "@/lib/errorHandling";
import { RateLimitErrorMessage } from "@/components/RateLimitErrorMessage";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { CustomChip } from "@/components/CustomChip";
import { nuqsJobSearchParamSchema } from "@/lib/schema/nuqsJobSearchParamSchema";
import { ClickType, isMiddleClick, getClickType } from "@/lib/getClickType";

export type AllJobsPageDataSelect = Pick<JobPostingTable, "id" | "title" | "updated_at" | "job_posted_date" | "closed_date"> & {
  [DBTable.COMPANY]: Pick<CompanyTable, "company_name" | "logo_url">;
} & JobPostingCountry &
  JobPostingExperienceLevel &
  JobPostingJobCategory;

export type AllJobsPageData = StrictOmit<AllJobsPageDataSelect, "job_posting_country" | "job_posting_experience_level" | "job_posting_job_category"> &
  JobPostingCountryJoined &
  JobPostingExperienceLevelJoined &
  JobPostingJobCategoryJoined;

const DEFAULT_RESPONSE: AllJobsPageResponse = {
  data: [],
  totalPages: 1,
};

export function AllJobSearchResult() {
  const [{ page, search, isVerified, countries, sortOrder, experienceLevelNames, jobCategoryNames }, setQueryStates] = useQueryStates(nuqsJobSearchParamSchema);

  const debouncedSearch = useDebounce(search);

  const {
    data: apiResponse,
    error,
    isLoading,
  } = useSWR<AllJobsPageResponse>(
    API.JOB_POSTING.getAll({
      page,
      search: debouncedSearch,
      isVerified,
      selectedCountries: countries,
      sortOrder,
      experienceLevelNames,
      jobCategoryNames,
    }),
    fetcher,
  );

  const { data: jobs = [], totalPages = 1 } = apiResponse ?? DEFAULT_RESPONSE;

  const handlePageChange = (newPage: number) => {
    mixpanel.track("All Jobs Action", {
      action: "page_changed",
      previous_page: page,
      page_number: newPage,
    });
    setQueryStates({ page: newPage });
  };

  const mixpanelTrackJobClick = (jobId: string, clickType: ClickType) => {
    const clickedJob = jobs.find((job) => job.id === jobId);

    mixpanel.track("All Jobs Card Click", {
      click_type: clickType,
      job_id: jobId,
      company_name: clickedJob?.company.company_name,
      job_title: clickedJob?.title,
    });
  };

  // console.log("jobs", jobs);

  // Handle rate limit error
  if (error) {
    if (isRateLimitError(error)) {
      return <RateLimitErrorMessage />;
    }

    return <ErrorMessageContent message="Failed to load jobs" />;
  }

  if (isLoading) return <LoadingContent />;

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
              <Card
                key={job.id}
                isPressable
                as={NextLink}
                className="w-full bg-background/60 hover:bg-default-100 dark:bg-default-100/50"
                href={`/job/${job.id}`}
                onContextMenu={() => mixpanelTrackJobClick(job.id, "right_clicked")}
                onPress={(e) => mixpanelTrackJobClick(job.id, getClickType(e))}
                onAuxClick={(e) => {
                  if (isMiddleClick(e)) {
                    mixpanelTrackJobClick(job.id, "middle_clicked");
                  }
                }}
              >
                <CardBody className="p-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Company Logo - Make it smaller on mobile */}
                    <div className="h-12 w-12 flex-shrink-0 sm:h-14 sm:w-14">
                      <ImageWithFallback alt={job.company.company_name} companyName={job.company.company_name} src={job.company.logo_url} />
                    </div>

                    {/* Job Details */}
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      {/* added min-w-0 to handle text overflow */}
                      {/* Company Name and Time */}
                      <div className="flex justify-between gap-1">
                        <p className="break-words text-small font-medium text-default-500 sm:text-medium">{job.company.company_name}</p>
                        <span className="flex-shrink-0 whitespace-nowrap text-tiny text-default-400 sm:text-small">{formatHowLongAgo(job.updated_at)}</span>
                      </div>

                      {/* Job Title - Allow it to wrap naturally */}
                      <p className="text-base font-semibold leading-tight text-default-800 sm:text-lg">{job.title}</p>

                      {/* Badges Row - Only render if there are badges to show */}
                      {((job.job_posted_date && isRecentDate(job.job_posted_date)) || job.closed_date) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {job.job_posted_date && isRecentDate(job.job_posted_date) && (
                            <CustomChip color="success" size="sm" variant="flat">
                              New
                            </CustomChip>
                          )}
                          {job.closed_date && (
                            <CustomChip color="warning" size="sm" variant="flat">
                              {formatClosingDate(job.closed_date)}
                            </CustomChip>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-center">
            <Pagination showControls initialPage={1} page={page} total={totalPages} onChange={handlePageChange} />
          </div>
        </>
      )}
    </div>
  );
}
