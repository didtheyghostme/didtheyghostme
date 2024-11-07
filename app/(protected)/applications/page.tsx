"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardHeader, CardBody, Chip, Button, Link } from "@nextui-org/react";
import mixpanel from "mixpanel-browser";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { formatDateDayMonthYear } from "@/lib/formatDateUtils";
import ImageWithFallback from "@/components/ImageWithFallback";
import { DBTable } from "@/lib/constants/dbTables";
import LoadingContent from "@/components/LoadingContent";
import ErrorMessageContent from "@/components/ErrorMessageContent";

export type MyApplicationResponse = Pick<ApplicationTable, "id" | "status" | "applied_date" | "first_response_date" | "created_at"> & {
  [DBTable.JOB_POSTING]: Pick<JobPostingTable, "id" | "title" | "country"> & {
    [DBTable.COMPANY]: Pick<CompanyTable, "id" | "company_name" | "logo_url">;
  };
};

export default function MyApplicationsPage() {
  const router = useRouter();
  const { data: applications, error, isLoading } = useSWR<MyApplicationResponse[]>(API.PROTECTED.getByCurrentUser, fetcher);

  if (isLoading) return <LoadingContent />;
  if (error) return <ErrorMessageContent message="Failed to load applications" />;
  if (!applications) return <ErrorMessageContent message="No applications found" />;

  const handleViewApplication = (applicationId: string) => {
    mixpanel.track("My Applications Page", {
      action: "view_interview_details_button_clicked",
      application_id: applicationId,
    });
    router.push(`/interview/${applicationId}`);
  };

  const handleViewJob = (jobId: string) => {
    mixpanel.track("My Applications Page", {
      action: "view_job_post_button_clicked",
      job_id: jobId,
    });
    router.push(`/job/${jobId}`);
  };

  const mixpanelTrackCompanyNameClick = (companyId: string) => {
    mixpanel.track("My Applications Page", {
      action: "company_name_clicked",
      company_id: companyId,
    });
  };

  return (
    <>
      <h1 className="mb-8 text-xl font-bold sm:text-2xl">My Job Applications</h1>

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
                    onClick={() => mixpanelTrackCompanyNameClick(application.job_posting.company.id)}
                  >
                    {application.job_posting.company.company_name}
                  </Link>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Chip color="primary" variant="flat">
                  {application.status}
                </Chip>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col gap-2">
                <p>Applied on: {formatDateDayMonthYear(application.applied_date)}</p>
                {application.first_response_date && <p>First response: {formatDateDayMonthYear(application.first_response_date)}</p>}
                <div className="flex gap-2">
                  <Button color="secondary" variant="flat" onPress={() => handleViewJob(application.job_posting.id)}>
                    View Job Post
                  </Button>
                  <Button color="primary" variant="flat" onPress={() => handleViewApplication(application.id)}>
                    View Interview Details
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
