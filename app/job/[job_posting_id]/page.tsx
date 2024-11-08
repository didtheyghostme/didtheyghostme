"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, CardHeader, Divider, Button, LinkIcon, Link, useDisclosure, Tab, Tabs } from "@nextui-org/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Key } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import mixpanel from "mixpanel-browser";
import { toast } from "sonner";

import { ReportLinkModal } from "./ReportLinkModal";
import { TrackThisJobModal } from "./TrackThisJobModal";
import { TableOfAppliedApplication } from "./TableOfAppliedApplication";
import { InterviewExperienceContent } from "./InterviewExperienceContent";
import { OnlineAssessmentContent } from "./OnlineAssessmentContent";
import { QuestionContent } from "./QuestionContent";
import { SuggestLinkModal } from "./SuggestLinkModal";

import { fetcher } from "@/lib/fetcher";
import { ArrowLeftIcon, FlagIcon, PlusIcon } from "@/components/icons";
import { useCreateApplication } from "@/lib/hooks/useCreateApplication";
import { API } from "@/lib/constants/apiRoutes";
import { DBTable } from "@/lib/constants/dbTables";
import { JOB_POST_PAGE_TABS } from "@/lib/constants/jobPostPageTabs";
import { GetAllApplicationsByJobPostingIdResponse } from "@/app/api/job/[job_posting_id]/application/route";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { ERROR_MESSAGES, isRateLimitError } from "@/lib/errorHandling";
import { RateLimitErrorMessage } from "@/components/RateLimitErrorMessage";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { DataNotFoundMessage } from "@/components/DataNotFoundMessage";

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

export type JobDetails = Pick<JobPostingTable, "id" | "title" | "country" | "url" | "job_status"> & {
  [DBTable.COMPANY]: Pick<CompanyTable, "id" | "company_name" | "logo_url">;
};

export default function JobDetailsPage() {
  const pathname = usePathname(); // Get current path

  const { job_posting_id } = useParams();
  const [selectedTab, setSelectedTab] = useQueryState("tab", parseAsStringLiteral(tabKeys).withDefault("Applied"));

  const { data: jobDetails, error, isLoading } = useSWR<JobDetails>(API.JOB_POSTING.getById(job_posting_id as string), fetcher);

  console.log("jobDetails from page", jobDetails);

  // const { data: jobDetails, error, isLoading } = useSWR<JobDetails>(`/api/job/${job_posting_id}`, fetcher);
  const router = useRouter();
  const { isOpen: isReportModalOpen, onOpen: onReportModalOpen, onClose: onReportModalClose } = useDisclosure();
  const { isOpen: isTrackModalOpen, onOpen: onTrackModalOpen, onClose: onTrackModalClose } = useDisclosure();

  const { isOpen: isSuggestModalOpen, onOpen: onSuggestModalOpen, onClose: onSuggestModalClose } = useDisclosure();

  const {
    data: applications,
    error: applicationsError,
    isLoading: applicationsIsLoading,
  } = useSWR<GetAllApplicationsByJobPostingIdResponse>(API.APPLICATION.getAllByJobPostingId(job_posting_id as string), fetcher);

  console.warn("applications", applications);

  const { createApplication, isCreating } = useCreateApplication(job_posting_id as string);

  if (isLoading || applicationsIsLoading) return <LoadingContent />;
  if (error || applicationsError) {
    if (isRateLimitError(error) || isRateLimitError(applicationsError)) {
      return <RateLimitErrorMessage />;
    }

    return <ErrorMessageContent message="Failed to load data" />;
  }
  if (!jobDetails) return <DataNotFoundMessage message="Job not found" />;
  if (!applications?.data) return <DataNotFoundMessage message="Applications not found" />;

  const handleBackClick = () => {
    mixpanel.track("back_button_clicked", {
      page: "job_posting_page",
      company_id: jobDetails.company.id,
      job_id: jobDetails.id,
    });
    router.push(`/company/${jobDetails.company.id}`);
  };

  const handleTrackJobSubmit = async (appliedDateString: string) => {
    try {
      mixpanel.track("Job Posting Page", {
        action: "track_this_job_submitted",
        job_id: job_posting_id,
        applied_date: appliedDateString,
      });

      const result = await createApplication(appliedDateString);

      toast.success("Job tracked successfully");

      console.log("Application created", result);
    } catch (err: unknown) {
      if (isRateLimitError(err)) {
        toast.error(ERROR_MESSAGES.TOO_MANY_REQUESTS);

        return; // Return early to avoid showing generic error
      }

      mixpanel.track("Job Posting Page", {
        action: "track_this_job_error",
        job_id: job_posting_id,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      });
      toast.error("Error tracking job");
      console.error("Error creating application:", err);
    }
  };

  // Track job portal link clicks
  const mixpanelTrackJobPortalClick = () => {
    mixpanel.track("Job Posting Page", {
      action: "job_portal_clicked",
      job_id: job_posting_id,
      url: jobDetails.url,
    });
  };

  const mixpanelTrackReportLinkClick = () => {
    mixpanel.track("Job Posting Page", {
      action: "report_link_clicked",
      job_id: job_posting_id,
    });
  };

  // Track report link interactions
  const handleReportLinkModalOpen = () => {
    mixpanelTrackReportLinkClick();
    onReportModalOpen();
  };

  const mixpanelTrackSuggestLinkClick = () => {
    mixpanel.track("Job Posting Page", {
      action: "suggest_link_clicked",
      job_id: job_posting_id,
    });
  };

  // Track suggest link interactions
  const handleSuggestLinkClick = () => {
    mixpanelTrackSuggestLinkClick();
    onSuggestModalOpen();
  };

  // Track job tracking interactions
  const handleTrackThisJobClick = () => {
    mixpanel.track("Job Posting Page", {
      action: "track_job_modal_opened",
      job_id: job_posting_id,
    });
    onTrackModalOpen();
  };

  // const handleApplicationClick = (application: ProcessedApplication) => {
  //   console.log("Application clicked", application);
  //   // TODO: go to specific application page, with application id, show all interview experiences of this application
  //   // TODO: interview experience page, can have a button to add LinkedIn URL, update status button Rejected | Accepted | Ghosted from Applied
  //   router.push(`/interview/${application.id}`);
  // };

  // Track application view
  const handleViewMyApplicationClick = (applicationId: string) => {
    mixpanel.track("Job Posting Page", {
      action: "view_my_application_clicked",
      job_id: job_posting_id,
      application_id: applicationId,
    });
    router.push(`/interview/${applicationId}`);
  };

  // Track tab changes
  const handleTabChange = (key: Key) => {
    mixpanel.track("Job Posting Page", {
      action: "tab_changed",
      job_id: job_posting_id,
      from_tab: selectedTab,
      to_tab: key,
    });
    setSelectedTab(key as TabKey);
  };

  return (
    <div className="">
      <Button className="mb-4 px-0" color="primary" startContent={<ArrowLeftIcon />} variant="light" onPress={handleBackClick}>
        Back to {jobDetails.company.company_name}
      </Button>

      <Card className="mb-8">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Mobile Layout */}
          <div className="flex w-full flex-col gap-1 sm:hidden">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <ImageWithFallback
                    alt={jobDetails.company.company_name}
                    className="h-12 w-12 rounded-lg object-cover"
                    companyName={jobDetails.company.company_name}
                    src={jobDetails.company.logo_url}
                  />
                </div>

                {/* Job Portal Link - Now next to image */}
                {jobDetails.url && (
                  <Link isExternal className="flex items-center gap-1 hover:underline" href={jobDetails.url} onPress={mixpanelTrackJobPortalClick}>
                    <LinkIcon />
                    Job portal
                  </Link>
                )}
              </div>

              {/* Report Link | Suggest Link Button - Stays on right */}
              {jobDetails.url && (
                <>
                  <SignedIn>
                    <Button
                      className="transition-all duration-200 hover:bg-danger/40 hover:text-danger-foreground"
                      color="danger"
                      size="sm"
                      startContent={<FlagIcon />}
                      variant="flat"
                      onPress={handleReportLinkModalOpen}
                    >
                      Report Link
                    </Button>
                  </SignedIn>
                  <SignedOut>
                    <SignInButton fallbackRedirectUrl={pathname} mode="modal">
                      <Button
                        className="transition-all duration-200 hover:bg-danger/40 hover:text-danger-foreground"
                        color="danger"
                        size="sm"
                        startContent={<FlagIcon />}
                        variant="flat"
                        onPress={mixpanelTrackReportLinkClick}
                      >
                        Report Link
                      </Button>
                    </SignInButton>
                  </SignedOut>
                </>
              )}
              {!jobDetails.url && (
                <div className="flex flex-col items-end gap-1">
                  <p className="text-default-500">No job portal link available</p>
                  <SignedIn>
                    <Button
                      className="gap-0 px-1 transition-all duration-200 hover:bg-primary/70 hover:text-primary-foreground"
                      color="primary"
                      size="sm"
                      startContent={<PlusIcon />}
                      variant="flat"
                      onPress={handleSuggestLinkClick}
                    >
                      Suggest a job portal link
                    </Button>
                  </SignedIn>
                  <SignedOut>
                    <SignInButton fallbackRedirectUrl={pathname} mode="modal">
                      <Button
                        className="gap-0 px-1 transition-all duration-200 hover:bg-primary/70 hover:text-primary-foreground"
                        color="primary"
                        size="sm"
                        startContent={<PlusIcon />}
                        variant="flat"
                        onPress={mixpanelTrackSuggestLinkClick}
                      >
                        Suggest a job portal link
                      </Button>
                    </SignInButton>
                  </SignedOut>
                </div>
              )}
            </div>
            <div>
              <p className="text-lg font-normal">{jobDetails.title}</p>
              <p className="text-default-500">{jobDetails.company.company_name}</p>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex sm:items-center sm:gap-3">
            <div className="flex-shrink-0">
              <ImageWithFallback alt={jobDetails.company.company_name} className="h-12 w-12 rounded-lg object-cover" companyName={jobDetails.company.company_name} src={jobDetails.company.logo_url} />
            </div>
            <div>
              <p className="text-lg font-normal">{jobDetails.title}</p>
              <p className="text-default-500">{jobDetails.company.company_name}</p>
            </div>
          </div>

          {/* Buttons Section for Desktop */}
          <div className="hidden sm:block">
            {jobDetails.url && (
              <div className="flex items-center gap-2">
                <Link isExternal className="flex items-center gap-1 hover:underline" href={jobDetails.url} onPress={mixpanelTrackJobPortalClick}>
                  <LinkIcon />
                  Job portal
                </Link>
                <SignedIn>
                  <Button
                    className="transition-all duration-200 hover:bg-danger/40 hover:text-danger-foreground"
                    color="danger"
                    size="sm"
                    startContent={<FlagIcon />}
                    variant="flat"
                    onPress={handleReportLinkModalOpen}
                  >
                    Report Link
                  </Button>
                </SignedIn>
                <SignedOut>
                  <SignInButton fallbackRedirectUrl={pathname} mode="modal">
                    <Button
                      className="transition-all duration-200 hover:bg-danger/40 hover:text-danger-foreground"
                      color="danger"
                      size="sm"
                      startContent={<FlagIcon />}
                      variant="flat"
                      onPress={mixpanelTrackReportLinkClick}
                    >
                      Report Link
                    </Button>
                  </SignInButton>
                </SignedOut>
              </div>
            )}
            {!jobDetails.url && (
              <div className="flex flex-col items-end gap-1">
                <p className="text-default-500">No job portal link available</p>
                <SignedIn>
                  <Button
                    className="gap-0 px-2 transition-all duration-200 hover:bg-primary/70 hover:text-primary-foreground"
                    color="primary"
                    size="sm"
                    startContent={<PlusIcon />}
                    variant="flat"
                    onPress={handleSuggestLinkClick}
                  >
                    Suggest a job portal link
                  </Button>
                </SignedIn>
                <SignedOut>
                  <SignInButton fallbackRedirectUrl={pathname} mode="modal">
                    <Button
                      className="gap-0 px-2 transition-all duration-200 hover:bg-primary/70 hover:text-primary-foreground"
                      color="primary"
                      size="sm"
                      startContent={<PlusIcon />}
                      variant="flat"
                      onPress={mixpanelTrackSuggestLinkClick}
                    >
                      Suggest a job portal link
                    </Button>
                  </SignInButton>
                </SignedOut>
              </div>
            )}
          </div>
        </CardHeader>

        <Divider />

        <CardBody>
          <SignedIn>
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
                isLoading={isCreating}
                variant="bordered"
                onPress={handleTrackThisJobClick}
              >
                Track this job
              </Button>
            )}
          </SignedIn>

          <SignedOut>
            <SignInButton fallbackRedirectUrl={pathname} mode="modal">
              <Button className="border-primary text-primary transition-all duration-200 hover:bg-primary/90 hover:text-primary-foreground" color="primary" variant="bordered">
                Sign in to track this job
              </Button>
            </SignInButton>
          </SignedOut>
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

      <ReportLinkModal isOpen={isReportModalOpen} jobId={jobDetails.id} jobStatus={jobDetails.job_status} onClose={onReportModalClose} />

      <TrackThisJobModal isOpen={isTrackModalOpen} onClose={onTrackModalClose} onSubmit={handleTrackJobSubmit} />

      <SuggestLinkModal isOpen={isSuggestModalOpen} jobId={jobDetails.id} jobStatus={jobDetails.job_status} onClose={onSuggestModalClose} />
    </div>
  );
}
