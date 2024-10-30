"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardHeader, CardBody, Chip, Button, Link } from "@nextui-org/react";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { formatDateDayMonthYear } from "@/lib/formatDateUtils";
import ImageWithFallback from "@/components/ImageWithFallback";
import { DBTable } from "@/lib/constants/dbTables";

export type MyApplicationResponse = Pick<ApplicationTable, "id" | "status" | "applied_date" | "first_response_date" | "created_at"> & {
  [DBTable.JOB_POSTING]: Pick<JobPostingTable, "id" | "title" | "country"> & {
    [DBTable.COMPANY]: Pick<CompanyTable, "company_name" | "logo_url">;
  };
};

export default function MyApplicationsPage() {
  const router = useRouter();
  const { data: applications, error, isLoading } = useSWR<MyApplicationResponse[]>(API.PROTECTED.getByCurrentUser, fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading applications</div>;
  if (!applications) return <div>No applications found</div>;

  const handleViewApplication = (applicationId: string) => {
    router.push(`/interview/${applicationId}`);
  };

  const handleViewJob = (jobId: string) => {
    router.push(`/job/${jobId}`);
  };

  return (
    <>
      <h1 className="mb-8 text-3xl font-bold">My Job Applications</h1>

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
                  <Link className="block text-lg font-semibold text-blue-600 hover:underline" href={`/job/${application.job_posting.id}`}>
                    {application.job_posting.title}
                  </Link>
                  <p className="text-sm text-gray-500">{application.job_posting.company.company_name}</p>
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

      <div className="mt-16 text-end">
        <a className="text-xs" href="https://logo.dev" rel="noreferrer" target="_blank">
          Logos provided by Logo.dev
        </a>
      </div>
    </>
  );
}
