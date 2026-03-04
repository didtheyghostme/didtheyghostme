"use client";

import useSWR from "swr";
import { Card, CardBody, CardHeader, Link, Tab, Tabs } from "@heroui/react";
import mixpanel from "mixpanel-browser";
import NextLink from "next/link";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { formatDateDayMonthYear } from "@/lib/formatDateUtils";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { DBTable } from "@/lib/constants/dbTables";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { CustomChip } from "@/components/CustomChip";
import { CustomButton } from "@/components/CustomButton";
import { DataNotFoundMessage } from "@/components/DataNotFoundMessage";
import { ClickType, getClickType, isMiddleClick } from "@/lib/getClickType";
import { useJobPostingStateList } from "@/lib/hooks/useUserJobPostingState";

export type MyApplicationResponse = Pick<ApplicationTable, "id" | "status" | "applied_date" | "first_response_date" | "created_at"> & {
  [DBTable.JOB_POSTING]: Pick<JobPostingTable, "id" | "title"> & {
    [DBTable.COMPANY]: Pick<CompanyTable, "id" | "company_name" | "logo_url">;
  };
};

export default function MyApplicationsPage() {
  const { userId } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"to_apply" | "applied" | "skipped">("applied");

  const { data: applications, error, isLoading } = useSWR<MyApplicationResponse[]>(API.PROTECTED.getByCurrentUser, fetcher);
  const { data: toApplyItems, error: toApplyError, isLoading: toApplyLoading } = useJobPostingStateList("to_apply", userId);
  const { data: skippedItems, error: skippedError, isLoading: skippedLoading } = useJobPostingStateList("skipped", userId);

  const isAnyLoading = isLoading || toApplyLoading || skippedLoading;

  if (isAnyLoading) return <LoadingContent />;
  if (error || toApplyError || skippedError) return <ErrorMessageContent message="Failed to load applications" />;
  if (!applications || !toApplyItems || !skippedItems) return <ErrorMessageContent message="No applications found" />;

  const appliedJobPostingIds = new Set(applications.map((a) => a.job_posting.id));
  const filteredToApplyItems = toApplyItems.filter((item) => !appliedJobPostingIds.has(item.job_posting.id));

  const mixpanelTrackViewInterviewDetailsButtonClick = (applicationId: string, clickType: ClickType) => {
    mixpanel.track("My Applications Page", {
      action: "view_interview_details_button_clicked",
      application_id: applicationId,
      click_type: clickType,
    });
  };

  const mixpanelTrackViewJobPostButtonClick = (jobId: string, clickType: ClickType) => {
    mixpanel.track("My Applications Page", {
      action: "view_job_post_button_clicked",
      job_id: jobId,
      click_type: clickType,
    });
  };

  const mixpanelTrackCompanyNameClick = (companyId: string, clickType: ClickType) => {
    mixpanel.track("My Applications Page", {
      action: "company_name_clicked",
      company_id: companyId,
      click_type: clickType,
    });
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">My Job Applications</h1>
        <CustomButton as={NextLink} color="secondary" href="/notes" variant="flat">
          View jobs with notes
        </CustomButton>
      </div>

      <Tabs selectedKey={selectedTab} onSelectionChange={(key) => setSelectedTab(key as typeof selectedTab)}>
        <Tab key="to_apply" title="To Apply">
          {filteredToApplyItems.length === 0 ? (
            <DataNotFoundMessage message="No jobs in your To Apply list yet." title="To Apply is empty" />
          ) : (
            <div className="flex flex-col gap-4">
              {filteredToApplyItems.map((item) => (
                <Card key={item.job_posting.id} className="w-full">
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="flex flex-1 items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
                        <ImageWithFallback
                          alt={item.job_posting.company.company_name}
                          className="h-full w-full rounded-lg object-cover"
                          companyName={item.job_posting.company.company_name}
                          src={item.job_posting.company.logo_url}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold">{item.job_posting.title}</p>
                        <p className="text-sm text-default-500">{item.job_posting.company.company_name}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <CustomChip color="primary" variant="flat">
                        To Apply
                      </CustomChip>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="flex flex-col gap-2">
                      {item.note && <p className="line-clamp-2 text-sm text-default-600">{item.note}</p>}
                      <div className="flex gap-2">
                        <CustomButton as={NextLink} color="secondary" href={`/job/${item.job_posting.id}`} variant="flat">
                          View Job Post
                        </CustomButton>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </Tab>

        <Tab key="applied" title="Applied">
          {applications.length === 0 ? (
            <DataNotFoundMessage message="You have not applied to any jobs yet." title="No applications found" />
          ) : (
            <div className="flex flex-col gap-4">
              {applications.map((application) => (
                <Card key={application.id} className="w-full">
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="flex flex-1 items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
                        <ImageWithFallback
                          alt={application.job_posting.company.company_name}
                          className="h-full w-full rounded-lg object-cover"
                          companyName={application.job_posting.company.company_name}
                          src={application.job_posting.company.logo_url}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold">{application.job_posting.title}</p>
                        <Link
                          className="inline text-sm text-blue-600 hover:underline"
                          href={`/company/${application.job_posting.company.id}`}
                          onContextMenu={() => mixpanelTrackCompanyNameClick(application.job_posting.company.id, "right_clicked")}
                          onPress={(e) => mixpanelTrackCompanyNameClick(application.job_posting.company.id, getClickType(e))}
                          onAuxClick={(e) => {
                            if (isMiddleClick(e)) {
                              mixpanelTrackCompanyNameClick(application.job_posting.company.id, "middle_clicked");
                            }
                          }}
                        >
                          {application.job_posting.company.company_name}
                        </Link>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <CustomChip color="primary" variant="flat">
                        {application.status}
                      </CustomChip>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="flex flex-col gap-2">
                      <p>Applied on: {formatDateDayMonthYear(application.applied_date)}</p>
                      {application.first_response_date && <p>First response: {formatDateDayMonthYear(application.first_response_date)}</p>}
                      <div className="flex gap-2">
                        <CustomButton
                          as={NextLink}
                          color="secondary"
                          href={`/job/${application.job_posting.id}`}
                          variant="flat"
                          onContextMenu={() => mixpanelTrackViewJobPostButtonClick(application.job_posting.id, "right_clicked")}
                          onPress={(e) => mixpanelTrackViewJobPostButtonClick(application.job_posting.id, getClickType(e))}
                          onAuxClick={(e) => {
                            if (isMiddleClick(e)) {
                              mixpanelTrackViewJobPostButtonClick(application.job_posting.id, "middle_clicked");
                            }
                          }}
                        >
                          View Job Post
                        </CustomButton>

                        <CustomButton
                          as={NextLink}
                          color="primary"
                          href={`/interview/${application.id}`}
                          variant="flat"
                          onContextMenu={() => mixpanelTrackViewInterviewDetailsButtonClick(application.id, "right_clicked")}
                          onPress={(e) => mixpanelTrackViewInterviewDetailsButtonClick(application.id, getClickType(e))}
                          onAuxClick={(e) => {
                            if (isMiddleClick(e)) {
                              mixpanelTrackViewInterviewDetailsButtonClick(application.id, "middle_clicked");
                            }
                          }}
                        >
                          View Interview Details
                        </CustomButton>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </Tab>

        <Tab key="skipped" title="Skipped">
          {skippedItems.length === 0 ? (
            <DataNotFoundMessage message="No skipped jobs yet." title="Skipped is empty" />
          ) : (
            <div className="flex flex-col gap-4">
              {skippedItems.map((item) => (
                <Card key={item.job_posting.id} className="w-full">
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="flex flex-1 items-start gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
                        <ImageWithFallback
                          alt={item.job_posting.company.company_name}
                          className="h-full w-full rounded-lg object-cover"
                          companyName={item.job_posting.company.company_name}
                          src={item.job_posting.company.logo_url}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold">{item.job_posting.title}</p>
                        <p className="text-sm text-default-500">{item.job_posting.company.company_name}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <CustomChip color="default" variant="flat">
                        Skipped
                      </CustomChip>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="flex flex-col gap-2">
                      {item.note && <p className="line-clamp-2 text-sm text-default-600">{item.note}</p>}
                      <div className="flex gap-2">
                        <CustomButton as={NextLink} color="secondary" href={`/job/${item.job_posting.id}`} variant="flat">
                          View Job Post
                        </CustomButton>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </Tab>
      </Tabs>
    </>
  );
}
