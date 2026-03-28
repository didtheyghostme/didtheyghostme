"use client";

import type { JobPostingStateAction } from "@/lib/schema/jobPostingStateActionSchema";

import { useParams, usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, CardHeader, Divider, LinkIcon, Link, useDisclosure, Tab, Tabs, Textarea } from "@heroui/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Key, useEffect, useRef, useState } from "react";
import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import mixpanel from "mixpanel-browser";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { ReportLinkModal } from "./ReportLinkModal";
import { TrackThisJobModal } from "./TrackThisJobModal";
import { TableOfAppliedApplication } from "./TableOfAppliedApplication";
import { InterviewExperienceContent } from "./InterviewExperienceContent";
import { OnlineAssessmentContent } from "./OnlineAssessmentContent";
import { QuestionContent } from "./QuestionContent";
import { SuggestLinkModal } from "./SuggestLinkModal";
import { ReviewContent } from "./ReviewContent";

import { fetcher } from "@/lib/fetcher";
import { ArrowLeftIcon, BookmarkFilledIcon, BookmarkIcon, EditIcon, FlagIcon, PlusIcon, XCircleIcon } from "@/components/icons";
import { useCreateApplication } from "@/lib/hooks/useCreateApplication";
import { API } from "@/lib/constants/apiRoutes";
import { JOB_POST_PAGE_TABS } from "@/lib/constants/jobPostPageTabs";
import { GetAllApplicationsByJobPostingIdResponse } from "@/app/api/job/[job_posting_id]/application/route";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { ERROR_MESSAGES, getErrorMessage, isRateLimitError } from "@/lib/errorHandling";
import { RateLimitErrorMessage } from "@/components/RateLimitErrorMessage";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { DataNotFoundMessage } from "@/components/DataNotFoundMessage";
import { CustomButton } from "@/components/CustomButton";
import { JobDetails } from "@/app/api/job/[job_posting_id]/route";
import { useSWRWithAuthKey } from "@/lib/hooks/useSWRWithAuthKey";
import { useJobPostingState, useUpsertJobPostingState } from "@/lib/hooks/useUserJobPostingState";

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
  [JOB_POST_PAGE_TABS.REVIEWS]: {
    title: JOB_POST_PAGE_TABS.REVIEWS,
    content: (job_posting_id: string) => <ReviewContent job_posting_id={job_posting_id} />,
  },
} as const;

type TabKey = keyof typeof TABS;
const tabKeys = Object.keys(TABS) as TabKey[];

type JobPostingStateToggleAction = Exclude<JobPostingStateAction, { action: "set_note" }>;
type NoteEditEntryPoint = "empty_state_cta" | "existing_note_edit_button";
type NoteEditSession = {
  entryPoint: NoteEditEntryPoint;
  hadExistingNote: boolean;
};

function getNoteTransition(prevNote: string | null, nextNote: string | null) {
  if (!prevNote && nextNote) return "added";
  if (prevNote && !nextNote) return "cleared";

  return "updated";
}

export default function JobDetailsPage() {
  const pathname = usePathname(); // Get current path
  const { theme } = useTheme();

  const { job_posting_id } = useParams<{ job_posting_id: string }>();
  const [selectedTab, setSelectedTab] = useQueryState("tab", parseAsStringLiteral(tabKeys).withDefault("Applied"));

  const { userId } = useAuth();

  const { data: jobDetails, error, isLoading } = useSWR<JobDetails>(API.JOB_POSTING.getById(job_posting_id), fetcher);

  // console.log("jobDetails from page", jobDetails);

  // const { data: jobDetails, error, isLoading } = useSWR<JobDetails>(`/api/job/${job_posting_id}`, fetcher);
  const router = useRouter();
  const { isOpen: isReportModalOpen, onOpen: onReportModalOpen, onClose: onReportModalClose } = useDisclosure();
  const { isOpen: isTrackModalOpen, onOpen: onTrackModalOpen, onClose: onTrackModalClose } = useDisclosure();

  const { isOpen: isSuggestModalOpen, onOpen: onSuggestModalOpen, onClose: onSuggestModalClose } = useDisclosure();

  const {
    data: applications,
    error: applicationsError,
    isLoading: applicationsIsLoading,
  } = useSWRWithAuthKey<GetAllApplicationsByJobPostingIdResponse>(API.APPLICATION.getAllByJobPostingId(job_posting_id), userId);

  const { data: jobPostingState } = useJobPostingState(job_posting_id, userId);
  const { upsertJobPostingState, saveJobPostingStateNote } = useUpsertJobPostingState(
    job_posting_id,
    userId,
    jobDetails ? { id: jobDetails.id, title: jobDetails.title, company: jobDetails.company } : null,
  );
  const [noteDraft, setNoteDraft] = useState("");
  const [isNoteDirty, setIsNoteDirty] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaveError, setNoteSaveError] = useState<string | null>(null);
  const [noteEditSession, setNoteEditSession] = useState<NoteEditSession | null>(null);
  const jobPostingStateToastId = `jobPostingState:${job_posting_id}`;
  const jobPostingStateMutationSeqRef = useRef(0);
  const lastSyncedNoteRef = useRef("");
  const isNoteEditing = noteEditSession !== null;

  useEffect(() => {
    if (!userId) return;
    if (jobPostingState === undefined) return;

    const nextSyncedNote = jobPostingState?.note ?? "";
    const previousSyncedNote = lastSyncedNoteRef.current;
    const hasUncommittedEdits = isNoteDirty && noteDraft !== previousSyncedNote;

    lastSyncedNoteRef.current = nextSyncedNote;

    if (hasUncommittedEdits) return;

    setNoteDraft(nextSyncedNote);
    setIsNoteDirty(false);
  }, [isNoteDirty, jobPostingState, noteDraft, userId]);

  // console.warn("applications", applications);

  const { createApplication, isCreating } = useCreateApplication(job_posting_id, userId);

  if (isLoading || applicationsIsLoading) return <LoadingContent />;
  if (error || applicationsError) {
    if (isRateLimitError(error) || isRateLimitError(applicationsError)) {
      return <RateLimitErrorMessage />;
    }

    return <ErrorMessageContent message="Failed to load data" />;
  }
  if (!jobDetails) return <DataNotFoundMessage message="Job not found" />;
  if (!applications?.data) return <DataNotFoundMessage message="Applications not found" />;

  const hasTrackedApplication = !!applications.currentUserItemId;
  const isSkipped = !!jobPostingState?.skipped_at;
  const isToApply = !!jobPostingState?.to_apply_at && !isSkipped;

  const handleBackClick = () => {
    mixpanel.track("back_button_clicked", {
      page: "job_posting_page",
      company_id: jobDetails.company.id,
      job_id: jobDetails.id,
      job_title: jobDetails.title,
      company_name: jobDetails.company.company_name,
    });
    router.push(`/company/${jobDetails.company.id}`);
  };

  const handleTrackJobSubmit = async (appliedDateString: string) => {
    try {
      await createApplication({ applied_date: appliedDateString, job_title: jobDetails.title, company_name: jobDetails.company.company_name });

      toast.success("Job tracked successfully");

      onTrackModalClose();
      // console.log("Application created", result);
    } catch (err) {
      if (isRateLimitError(err)) {
        toast.error(ERROR_MESSAGES.TOO_MANY_REQUESTS);

        return; // Return early to avoid showing generic error
      }

      toast.error("Error tracking job", {
        description: getErrorMessage(err),
        cancel: {
          label: "X",
          onClick: () => toast.dismiss(),
        },
      });
      // console.error("Error creating application:", err);
    }
  };

  // Track job portal link clicks
  const mixpanelTrackJobPortalClick = () => {
    mixpanel.track("Job Posting Page - Job Portal Clicked", {
      action: "job_portal_clicked",
      job_id: job_posting_id,
      url: jobDetails.url,
      job_title: jobDetails.title,
      company_name: jobDetails.company.company_name,
    });
  };

  const mixpanelTrackReportLinkClick = () => {
    mixpanel.track("Job Posting Page", {
      action: "report_link_clicked",
      job_id: job_posting_id,
      job_title: jobDetails.title,
      company_name: jobDetails.company.company_name,
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
      job_title: jobDetails.title,
      company_name: jobDetails.company.company_name,
    });
  };

  // Track suggest link interactions
  const handleSuggestLinkClick = () => {
    mixpanelTrackSuggestLinkClick();
    onSuggestModalOpen();
  };

  // Track job tracking interactions
  const handleTrackThisJobClick = () => {
    mixpanel.track("Job Posting Page Track Job Modal Opened", {
      action: "track_job_modal_opened",
      job_id: job_posting_id,
      job_title: jobDetails.title,
      company_name: jobDetails.company.company_name,
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
  const trackViewMyApplicationClick = (applicationId: string) => {
    mixpanel.track("Job Posting Page", {
      action: "view_my_application_clicked",
      job_id: job_posting_id,
      application_id: applicationId,
      job_title: jobDetails.title,
      company_name: jobDetails.company.company_name,
    });
  };

  // Track tab changes
  const handleTabChange = (key: Key) => {
    mixpanel.track("Job Posting Page", {
      action: "tab_changed",
      job_id: job_posting_id,
      from_tab: selectedTab,
      to_tab: key,
      job_title: jobDetails.title,
      company_name: jobDetails.company.company_name,
    });
    setSelectedTab(key as TabKey);
  };

  const mixpanelTrackSignInToTrackJobClick = () => {
    mixpanel.track("Job Posting Page", {
      action: "sign_in_to_track_job_clicked",
      job_id: job_posting_id,
      job_title: jobDetails.title,
      company_name: jobDetails.company.company_name,
    });
  };

  const submitToggleAction = (action: JobPostingStateToggleAction, successMessage: string) => {
    const seq = ++jobPostingStateMutationSeqRef.current;

    mixpanel.track("Job Posting Page - Job State Toggle", {
      action: action.action,
      job_id: job_posting_id,
      job_title: jobDetails.title,
      company_name: jobDetails.company.company_name,
    });

    toast.success(successMessage, {
      id: jobPostingStateToastId,
    });

    upsertJobPostingState(action).catch((err) => {
      if (jobPostingStateMutationSeqRef.current !== seq) return;

      toast.error(err instanceof Error && err.message === ERROR_MESSAGES.TRACKED_JOB_STATE_CONFLICT ? "Couldn't save" : "Couldn't save — reverted", {
        id: jobPostingStateToastId,
        description: getErrorMessage(err),
      });
    });
  };

  const trackNoteEvent = (eventName: string, properties: Record<string, unknown> = {}) => {
    mixpanel.track(eventName, {
      job_id: job_posting_id,
      job_title: jobDetails.title,
      company_name: jobDetails.company.company_name,
      job_state: hasTrackedApplication ? "tracked" : isToApply ? "to_apply" : isSkipped ? "skipped" : "no_state",
      ...properties,
    });
  };

  const resetNoteEditor = (syncedNote: string) => {
    lastSyncedNoteRef.current = syncedNote;
    setNoteDraft(syncedNote);
    setIsNoteDirty(false);
    setNoteSaveError(null);
    setNoteEditSession(null);
  };

  const startNoteEditing = (entryPoint: NoteEditEntryPoint) => {
    if (noteEditSession) return;

    const session = {
      entryPoint,
      hadExistingNote: Boolean(lastSyncedNoteRef.current),
    } satisfies NoteEditSession;

    setNoteSaveError(null);
    setNoteEditSession(session);
    trackNoteEvent("Job Posting Page - Note Edit Started", {
      entry_point: session.entryPoint,
      had_existing_note: session.hadExistingNote,
    });
  };

  const handleCancelNote = () => {
    const syncedNote = jobPostingState?.note ?? "";
    const currentSession = noteEditSession;

    if (currentSession) {
      trackNoteEvent("Job Posting Page - Note Edit Cancelled", {
        entry_point: currentSession.entryPoint,
        had_existing_note: currentSession.hadExistingNote,
        had_unsaved_changes: isNoteDirty,
        draft_length: noteDraft.length,
      });
    }

    resetNoteEditor(syncedNote);
  };

  const handleSaveNote = async () => {
    const normalized = noteDraft.trim();
    const nextNote = normalized.length > 0 ? normalized : null;
    const prevNote = jobPostingState?.note ?? null;
    const noteTransition = getNoteTransition(prevNote, nextNote);
    const currentSession = noteEditSession;
    const noteSaveEventProps = {
      entry_point: currentSession?.entryPoint ?? null,
      note_transition: noteTransition,
      note_length: nextNote?.length ?? 0,
    };

    if (nextNote === prevNote) {
      resetNoteEditor(prevNote ?? "");

      return;
    }

    setIsSavingNote(true);
    setNoteSaveError(null);

    try {
      const result = await saveJobPostingStateNote(nextNote);
      const confirmedNote = result?.note ?? "";

      trackNoteEvent("Job Posting Page - Note Saved", noteSaveEventProps);

      resetNoteEditor(confirmedNote);

      toast.success("Note saved successfully");
    } catch (err) {
      const errorMessage = getErrorMessage(err);

      trackNoteEvent("Job Posting Page - Note Save Failed", {
        ...noteSaveEventProps,
        error_message: errorMessage,
      });

      setNoteSaveError(errorMessage);
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="">
      <CustomButton className="mb-4 px-0" color="primary" startContent={<ArrowLeftIcon />} variant="light" onPress={handleBackClick}>
        Back to {jobDetails.company.company_name}
      </CustomButton>

      <Card className="mb-8">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Mobile Layout */}
          <div className="flex w-full flex-col gap-4 sm:hidden">
            {/* Top Action Buttons */}
            {jobDetails.url && (
              <div className="flex justify-end gap-2">
                <Link isExternal className="flex items-center gap-1 text-primary hover:underline" href={jobDetails.url} onPress={mixpanelTrackJobPortalClick}>
                  <LinkIcon />
                  Job portal
                </Link>

                <SignedIn>
                  <CustomButton
                    className="transition-all duration-200 hover:bg-danger/40 hover:text-danger-foreground"
                    color="danger"
                    size="sm"
                    startContent={<FlagIcon />}
                    variant="flat"
                    onPress={handleReportLinkModalOpen}
                  >
                    Report job
                  </CustomButton>
                </SignedIn>
                <SignedOut>
                  <SignInButton fallbackRedirectUrl={pathname} mode="modal">
                    <CustomButton
                      className="transition-all duration-200 hover:bg-danger/40 hover:text-danger-foreground"
                      color="danger"
                      size="sm"
                      startContent={<FlagIcon />}
                      variant="flat"
                      onPress={mixpanelTrackReportLinkClick}
                    >
                      Report job
                    </CustomButton>
                  </SignInButton>
                </SignedOut>
              </div>
            )}

            {/* If no job portal link available */}
            {!jobDetails.url && (
              <div className="flex flex-col items-end gap-1">
                <p className="text-default-500">No job portal link available</p>
                <SignedIn>
                  <CustomButton
                    className="gap-0 px-1 transition-all duration-200 hover:bg-primary/70 hover:text-primary-foreground"
                    color="primary"
                    size="sm"
                    startContent={<PlusIcon />}
                    variant="flat"
                    onPress={handleSuggestLinkClick}
                  >
                    Suggest a job portal link
                  </CustomButton>
                </SignedIn>
                <SignedOut>
                  <SignInButton fallbackRedirectUrl={pathname} mode="modal">
                    <CustomButton
                      className="gap-0 px-1 transition-all duration-200 hover:bg-primary/70 hover:text-primary-foreground"
                      color="primary"
                      size="sm"
                      startContent={<PlusIcon />}
                      variant="flat"
                      onPress={mixpanelTrackSuggestLinkClick}
                    >
                      Suggest a job portal link
                    </CustomButton>
                  </SignInButton>
                </SignedOut>
              </div>
            )}

            {/* Logo and Title Row */}
            <div className="flex gap-3">
              <div className="h-12 w-12 flex-shrink-0">
                <ImageWithFallback alt={jobDetails.company.company_name} companyName={jobDetails.company.company_name} src={jobDetails.company.logo_url} />
              </div>
              <div className="flex flex-col">
                <p className="text-default-500">{jobDetails.company.company_name}</p>
                <p className="text-lg font-normal">{jobDetails.title}</p>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex sm:items-center sm:gap-3">
            <div className="h-12 w-12 flex-shrink-0">
              <ImageWithFallback alt={jobDetails.company.company_name} companyName={jobDetails.company.company_name} src={jobDetails.company.logo_url} />
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
                  <CustomButton
                    className="transition-all duration-200 hover:bg-danger/40 hover:text-danger-foreground"
                    color="danger"
                    size="sm"
                    startContent={<FlagIcon />}
                    variant="flat"
                    onPress={handleReportLinkModalOpen}
                  >
                    Report job
                  </CustomButton>
                </SignedIn>
                <SignedOut>
                  <SignInButton fallbackRedirectUrl={pathname} mode="modal">
                    <CustomButton
                      className="transition-all duration-200 hover:bg-danger/40 hover:text-danger-foreground"
                      color="danger"
                      size="sm"
                      startContent={<FlagIcon />}
                      variant="flat"
                      onPress={mixpanelTrackReportLinkClick}
                    >
                      Report job
                    </CustomButton>
                  </SignInButton>
                </SignedOut>
              </div>
            )}
            {!jobDetails.url && (
              <div className="flex flex-col items-end gap-1">
                <p className="text-center text-default-500">No job portal link available</p>
                <SignedIn>
                  <CustomButton
                    className="gap-0 px-2 transition-all duration-200 hover:bg-primary/70 hover:text-primary-foreground"
                    color="primary"
                    size="sm"
                    startContent={<PlusIcon />}
                    variant="flat"
                    onPress={handleSuggestLinkClick}
                  >
                    Suggest a job portal link
                  </CustomButton>
                </SignedIn>
                <SignedOut>
                  <SignInButton fallbackRedirectUrl={pathname} mode="modal">
                    <CustomButton
                      className="gap-0 px-2 transition-all duration-200 hover:bg-primary/70 hover:text-primary-foreground"
                      color="primary"
                      size="sm"
                      startContent={<PlusIcon />}
                      variant="flat"
                      onPress={mixpanelTrackSuggestLinkClick}
                    >
                      Suggest a job portal link
                    </CustomButton>
                  </SignInButton>
                </SignedOut>
              </div>
            )}
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="gap-4">
          <SignedIn>
            {isSkipped && !hasTrackedApplication && (
              <div className="flex items-center gap-2 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-600 dark:bg-warning-900/20 dark:text-warning-400">
                <XCircleIcon className="h-4 w-4 flex-shrink-0" />
                <span>You skipped this job posting</span>
              </div>
            )}
            {!hasTrackedApplication && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CustomButton
                    color={isToApply ? "primary" : "default"}
                    size="sm"
                    startContent={isToApply ? <BookmarkFilledIcon /> : <BookmarkIcon />}
                    variant={isToApply ? "flat" : "bordered"}
                    onPress={() => {
                      const action: JobPostingStateToggleAction = {
                        action: isToApply ? "clear_to_apply" : "set_to_apply",
                      };

                      submitToggleAction(action, isToApply ? "Job removed from your To Apply list" : "Job added to your To Apply list");
                    }}
                  >
                    To Apply
                  </CustomButton>

                  <CustomButton
                    color={isSkipped ? "warning" : "default"}
                    size="sm"
                    startContent={<XCircleIcon />}
                    variant={isSkipped ? "flat" : "bordered"}
                    onPress={() => {
                      const action: JobPostingStateToggleAction = {
                        action: isSkipped ? "clear_skipped" : "set_skipped",
                      };

                      submitToggleAction(action, isSkipped ? "Job removed from your Skipped list" : "Job added to your Skipped list");
                    }}
                  >
                    {isSkipped ? "Skipped" : "Skip"}
                  </CustomButton>
                </div>
              </div>
            )}
          </SignedIn>

          <SignedIn>
            {applications.currentUserItemId ? (
              <CustomButton
                as={Link}
                className="w-full transition-all duration-200 hover:bg-success/40 hover:text-success-foreground sm:w-auto"
                color="success"
                href={`/interview/${applications.currentUserItemId}`}
                variant="flat"
                onPress={() => trackViewMyApplicationClick(applications.currentUserItemId!)}
              >
                View my application
              </CustomButton>
            ) : (
              <CustomButton
                className="w-full transition-all duration-200 hover:bg-primary/90 hover:text-primary-foreground sm:w-auto"
                color="primary"
                variant="bordered"
                onPress={handleTrackThisJobClick}
              >
                Track this job
              </CustomButton>
            )}
          </SignedIn>

          <SignedOut>
            <SignInButton fallbackRedirectUrl={pathname} mode="modal">
              <CustomButton
                className="w-full transition-all duration-200 hover:bg-primary/90 hover:text-primary-foreground sm:w-auto"
                color="primary"
                variant="bordered"
                onPress={mixpanelTrackSignInToTrackJobClick}
              >
                Sign in to track this job
              </CustomButton>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="border-t border-divider pt-3">
              <p className="mb-2 text-sm font-medium text-default-600">My note (private)</p>

              {isNoteEditing ? (
                <div>
                  <Textarea
                    isDisabled={isSavingNote}
                    minRows={3}
                    placeholder={isSkipped ? "Why did you skip this job? (optional)" : "Add a private note for this job posting..."}
                    value={noteDraft}
                    onValueChange={(value) => {
                      setNoteDraft(value);
                      setIsNoteDirty(value !== lastSyncedNoteRef.current);
                      setNoteSaveError(null);
                    }}
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                    {isSavingNote ? <p className="text-xs text-default-500">Saving...</p> : null}
                    {!isSavingNote && noteSaveError ? <p className="text-xs text-danger">{noteSaveError}</p> : null}
                    {!isSavingNote && !noteSaveError && isNoteDirty ? <p className="text-xs text-default-500">Unsaved changes</p> : null}
                    <CustomButton color="default" isDisabled={isSavingNote} size="sm" variant="flat" onPress={handleCancelNote}>
                      Cancel
                    </CustomButton>
                    <CustomButton color="primary" isDisabled={!isNoteDirty || isSavingNote} isLoading={isSavingNote} size="sm" onPress={handleSaveNote}>
                      Save note
                    </CustomButton>
                  </div>
                </div>
              ) : noteDraft ? (
                <div className="relative rounded-lg border border-default-200 p-3">
                  <p className="whitespace-pre-wrap text-sm text-default-700">{noteDraft}</p>
                  <CustomButton
                    isIconOnly
                    className="absolute right-2 top-2 opacity-40 transition-opacity hover:opacity-100"
                    color="default"
                    size="sm"
                    variant="light"
                    onPress={() => startNoteEditing("existing_note_edit_button")}
                  >
                    <EditIcon />
                  </CustomButton>
                </div>
              ) : (
                <button
                  type="button"
                  className={
                    "flex w-full items-center gap-2 rounded-lg border border-default-200 " +
                    "px-3 py-2 text-left text-sm text-default-400 transition-colors hover:bg-default-100 hover:text-default-500"
                  }
                  onClick={() => startNoteEditing("empty_state_cta")}
                >
                  <EditIcon />
                  {isSkipped ? "Note why you skipped this job..." : "Add a private note for this job posting..."}
                </button>
              )}
            </div>
          </SignedIn>
        </CardBody>
      </Card>

      {/* Vertical tab */}
      <div className="flex w-full flex-col">
        <Tabs aria-label="Options" color={theme === "light" ? "primary" : "default"} selectedKey={selectedTab} onSelectionChange={handleTabChange}>
          {tabKeys.map((key) => (
            <Tab key={key} title={TABS[key].title}>
              {key === "Applied" ? TABS[key].content(applications.data) : TABS[key].content(job_posting_id)}
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

      <TrackThisJobModal isLoading={isCreating} isOpen={isTrackModalOpen} onClose={onTrackModalClose} onSubmit={handleTrackJobSubmit} />

      <SuggestLinkModal isOpen={isSuggestModalOpen} jobId={jobDetails.id} jobStatus={jobDetails.job_status} onClose={onSuggestModalClose} />
    </div>
  );
}
