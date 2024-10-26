"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, CardHeader, Divider, Chip, Button, Spacer, LinkIcon, Link, useDisclosure, Tab, Tabs } from "@nextui-org/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Key } from "react";

import ReportLinkModal from "./ReportLinkModal";
import TrackThisJobModal from "./TrackThisJobModal";
import TableOfAppliedApplication from "./TableOfAppliedApplication";
import { InterviewExperienceContent } from "./InterviewExperienceContent";
import { OnlineAssessmentContent } from "./OnlineAssessmentContent";
import { QuestionContent } from "./QuestionContent";

import { fetcher } from "@/lib/fetcher";
import { ArrowLeftIcon, FlagIcon } from "@/components/icons";
import { useCreateApplication } from "@/lib/hooks/useCreateApplication";
import { API } from "@/lib/constants/apiRoutes";
import { DBTable } from "@/lib/constants/dbTables";
import { JOB_POST_PAGE_TABS } from "@/lib/constants/jobPostPageTabs";
import { GetAllApplicationsByJobPostingIdResponse } from "@/app/api/job/[job_posting_id]/application/route";

// Define the tab mapping
const TABS = {
  [JOB_POST_PAGE_TABS.APPLIED]: {
    title: JOB_POST_PAGE_TABS.APPLIED,
    content: (applications: ProcessedApplication[]) => <TableOfAppliedApplication applications={applications} />,
  },
  [JOB_POST_PAGE_TABS.ONLINE_ASSESSMENT]: {
    title: JOB_POST_PAGE_TABS.ONLINE_ASSESSMENT,
    content: (job_posting_id: string) => <OnlineAssessmentContent job_posting_id={job_posting_id} />,
  },
  [JOB_POST_PAGE_TABS.INTERVIEW_EXPERIENCE]: {
    title: JOB_POST_PAGE_TABS.INTERVIEW_EXPERIENCE,
    content: (job_posting_id: string) => <InterviewExperienceContent job_posting_id={job_posting_id} />,
  },
  [JOB_POST_PAGE_TABS.QUESTIONS]: {
    title: JOB_POST_PAGE_TABS.QUESTIONS,
    content: (job_posting_id: string) => <QuestionContent job_posting_id={job_posting_id} />,
  },
} as const;

type TabKey = keyof typeof TABS;

const tabKeys = Object.keys(TABS) as TabKey[];

export type JobDetails = Pick<JobPostingTable, "id" | "title" | "country" | "url"> & {
  [DBTable.COMPANY]: Pick<CompanyTable, "id" | "company_name">;
};

export default function JobDetailsPage() {
  const { job_posting_id } = useParams();
  const [selectedTab, setSelectedTab] = useQueryState("tab", parseAsStringLiteral(tabKeys).withDefault("Applied"));

  const { data: jobDetails, error, isLoading } = useSWR<JobDetails>(API.JOB_POSTING.getById(job_posting_id as string), fetcher);

  console.log("jobDetails from page", jobDetails);

  // const { data: jobDetails, error, isLoading } = useSWR<JobDetails>(`/api/job/${job_posting_id}`, fetcher);
  const router = useRouter();
  const { isOpen: isReportModalOpen, onOpen: onReportModalOpen, onClose: onReportModalClose } = useDisclosure();
  const { isOpen: isTrackModalOpen, onOpen: onTrackModalOpen, onClose: onTrackModalClose } = useDisclosure();

  const {
    data: applications,
    error: applicationsError,
    isLoading: applicationsIsLoading,
  } = useSWR<GetAllApplicationsByJobPostingIdResponse>(API.APPLICATION.getAllByJobPostingId(job_posting_id as string), fetcher);

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
    // router.back();
    applications.data.forEach((application) => {
      console.log("application", application);
    });
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

  const handleTabChange = (key: Key) => {
    setSelectedTab(key as TabKey);
  };

  return (
    <div className="">
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
        <Tabs aria-label="Options" selectedKey={selectedTab} onSelectionChange={handleTabChange}>
          {tabKeys.map((key) => (
            <Tab key={key} title={TABS[key].title}>
              {key === "Applied" ? TABS[key].content(applications.data) : TABS[key].content(job_posting_id as string)}
            </Tab>
          ))}
        </Tabs>

        {/* TODO: Display table with application start date, applied on, replied on, days between, status below */}
        {/* TODO: 18 Oct Friday done */}

        {/* TODOO: 19/20 Oct Sunday, add the tags for interview round form so that Online Assessment tag can be captured here */}
        {/* done, now left design Tag: Online Assessment, HR Call, Technical, Behavioral, Hiring Manager */}
        {/* done add nuqs, get clerk user table (id, name, profile pic url) */}
      </div>

      <ReportLinkModal isOpen={isReportModalOpen} jobId={jobDetails.id} onClose={onReportModalClose} />

      <TrackThisJobModal isOpen={isTrackModalOpen} onClose={onTrackModalClose} onSubmit={handleTrackJobSubmit} />
    </div>
  );
}
