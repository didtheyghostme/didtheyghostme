"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, CardHeader, Divider, Chip, Button, Spacer, LinkIcon, Link, useDisclosure, Tab, Tabs } from "@nextui-org/react";

import ReportLinkModal from "./ReportLinkModal";
import TrackThisJobModal from "./TrackThisJobModal";

import { fetcher } from "@/lib/fetcher";
import { ArrowLeftIcon, FlagIcon } from "@/components/icons";
import { useCreateApplication } from "@/lib/hooks/useCreateApplication";
import { API } from "@/lib/constants/apiRoutes";
import { DBTable } from "@/lib/constants/dbTables";

export type JobDetails = Pick<JobPostingTable, "id" | "title" | "country" | "url"> & {
  [DBTable.COMPANY]: Pick<CompanyTable, "id" | "company_name">;
};

export default function JobDetailsPage() {
  const { job_posting_id } = useParams();
  const { data: jobDetails, error, isLoading } = useSWR<JobDetails>(API.JOB_POSTING.getById(job_posting_id as string), fetcher);
  console.log("jobDetails from page", jobDetails);

  // const { data: jobDetails, error, isLoading } = useSWR<JobDetails>(`/api/job/${job_posting_id}`, fetcher);
  const router = useRouter();
  const { isOpen: isReportModalOpen, onOpen: onReportModalOpen, onClose: onReportModalClose } = useDisclosure();
  const { isOpen: isTrackModalOpen, onOpen: onTrackModalOpen, onClose: onTrackModalClose } = useDisclosure();

  const { data: applications, error: applicationsError, isLoading: applicationsIsLoading } = useSWR<ProcessedApplications>(API.APPLICATION.getByJobPostingId(job_posting_id as string), fetcher);

  console.warn("applications", applications);

  const { createApplication } = useCreateApplication(job_posting_id as string);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading job details</div>;
  if (!jobDetails) return <div>Job not found</div>;
  if (applicationsIsLoading) return <div>Loading applications...</div>;
  if (applicationsError) return <div>Error loading applications</div>;
  if (!applications?.data) return <div>Applications not found</div>;

  const handleBackClick = () => {
    router.push(`/company/${jobDetails.company.id}`);
  };

  const handleReportLinkClick = () => {
    onReportModalOpen(); // Open the modal
  };

  const handleTrackThisJobClick = () => {
    onTrackModalOpen(); // Open the modal
  };

  const handleTrackJobSubmit = async (appliedDateUTC: string) => {
    console.log("Track job submitted", appliedDateUTC);
    // TODO: add to Application table, status default Applied
    try {
      const result = await createApplication(appliedDateUTC);

      console.log("Application created", result);
    } catch (err) {
      console.error("Error creating application:", err);
    }
  };

  const handleApplicationClick = (application: ProcessedApplication) => {
    console.log("Application clicked", application);
    // TODO: go to specific application page, with application id, show all interview experiences of this application
    // TODO: interview experience page, can have a button to add LinkedIn URL, update status button Rejected | Accepted | Ghosted from Applied
    router.push(`/interview/${application.id}`);
  };

  const handleViewMyApplicationClick = (applicationId: string) => {
    console.log("View my application clicked", applicationId);
    router.push(`/interview/${applicationId}`);
  };

  return (
    <div className="mx-auto max-w-[1024px]">
      <Button className="mb-4" color="primary" startContent={<ArrowLeftIcon />} variant="light" onPress={handleBackClick}>
        Back to {jobDetails.company.company_name}
      </Button>

      <Card className="mb-8">
        <CardHeader className="flex flex-row justify-between">
          <h1 className="text-3xl font-bold">{jobDetails.title}</h1>
          {jobDetails.url && (
            <div className="flex items-center gap-2">
              <Link isExternal href={jobDetails.url}>
                <LinkIcon />
                Job portal
              </Link>
              <Button color="danger" size="sm" startContent={<FlagIcon />} variant="flat" onPress={handleReportLinkClick}>
                Report Link
              </Button>
            </div>
          )}
        </CardHeader>
        <Divider />
        <CardBody>
          <p className="text-lg">Location: {jobDetails.country}</p>
          <Spacer y={2} />
          <Chip color="primary" variant="flat">
            Closed
          </Chip>
          {applications.currentUserItemId ? (
            <Button
              className="transition-all duration-200 hover:bg-success/40 hover:text-success-foreground"
              color="success"
              variant="flat"
              onPress={() => handleViewMyApplicationClick(applications.currentUserItemId!)}
            >
              View my application
            </Button>
          ) : (
            <Button
              className="border-primary text-primary transition-all duration-200 hover:bg-primary/90 hover:text-primary-foreground"
              color="primary"
              variant="bordered"
              onPress={handleTrackThisJobClick}
            >
              Track this job
            </Button>
          )}
        </CardBody>
      </Card>

      {/* Vertical tab */}
      <div className="flex w-full flex-col">
        <Tabs aria-label="Options">
          <Tab key="photos" title="Applied">
            {/* TODO: Display table with application start date, applied on, replied on, days between, status below */}
            <Card>
              <CardBody>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat.
              </CardBody>
            </Card>
          </Tab>
          <Tab key="music" title="Online Assessment">
            <Card>
              <CardBody>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                eu fugiat nulla pariatur.
              </CardBody>
            </Card>
          </Tab>
          <Tab key="videos" title="Interview Experience">
            <Card>
              <CardBody>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</CardBody>
            </Card>
          </Tab>
          <Tab key="questions" title="Questions">
            <Card>
              <CardBody>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>

      {/* TODO: add application cards below */}
      <div className="flex gap-4">
        {applications.data.map((application) => (
          <Card key={application.id} isPressable className="w-full" onPress={() => handleApplicationClick(application)}>
            <CardHeader>
              <h2 className="text-xl font-bold">
                {application.id} - {application.created_at}
              </h2>
            </CardHeader>
            <CardBody>
              <p>3 rounds</p>
              <p>Status: Applied and waiting for response</p>
              <Chip color="primary" variant="flat">
                {application.status}
              </Chip>
              <Chip color="danger" variant="flat">
                Rejected
              </Chip>
            </CardBody>
          </Card>
        ))}
      </div>

      <ReportLinkModal isOpen={isReportModalOpen} jobId={jobDetails.id} onClose={onReportModalClose} />

      <TrackThisJobModal isOpen={isTrackModalOpen} onClose={onTrackModalClose} onSubmit={handleTrackJobSubmit} />
    </div>
  );
}
