"use client";

import { useParams, useRouter } from "next/navigation";
import { Avatar, Card, CardBody, CardHeader, Divider, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spacer, Textarea, useDisclosure } from "@heroui/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import mixpanel from "mixpanel-browser";
import { useAuth } from "@clerk/nextjs";

import { ViewInterviewDetails } from "./ViewInterviewDetails";
import { EditInterviewDetails } from "./EditInterviewDetails";

import { API } from "@/lib/constants/apiRoutes";
import { ArrowLeftIcon } from "@/components/icons";
import { InterviewExperienceFormValues } from "@/lib/schema/updateInterviewRoundSchema";
import { InterviewExperienceCardData } from "@/lib/sharedTypes";
import { GetApplicationByIdResponse } from "@/app/api/application/[application_id]/route";
import { CommentSection } from "@/app/question/[comment_id]/CommentSection";
import { useUpdateApplicationAndInterviewRounds } from "@/lib/hooks/useUpdateApplicationAndInterviewRounds";
import { ERROR_MESSAGES } from "@/lib/errorHandling";
import { isRateLimitError } from "@/lib/errorHandling";
import { RateLimitErrorMessage } from "@/components/RateLimitErrorMessage";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { DataNotFoundMessage } from "@/components/DataNotFoundMessage";
import { CustomButton } from "@/components/CustomButton";
import { useSWRWithAuthKey } from "@/lib/hooks/useSWRWithAuthKey";
import { useApplicationReview, useDeleteApplicationReview, useUpsertApplicationReview } from "@/lib/hooks/useApplicationReview";
import { formatHowLongAgo } from "@/lib/formatDateUtils";

export default function InterviewExperiencePage() {
  const { application_id } = useParams<{ application_id: string }>();
  const router = useRouter();
  const { userId } = useAuth();

  // Fetch application details
  const { data: applicationDetails, error, isLoading } = useSWRWithAuthKey<GetApplicationByIdResponse>(API.APPLICATION.getByApplicationId(application_id), userId);

  // Fetch interview rounds, need useSWRWithAuthKey too to match the shared update mutation hook's cache key
  const {
    data: interviewRounds,
    error: interviewRoundsError,
    isLoading: interviewRoundsLoading,
  } = useSWRWithAuthKey<InterviewExperienceCardData[]>(API.INTERVIEW.getAllByApplicationId(application_id), userId);

  // Update application and interview rounds
  const { updateApplicationAndInterviewRounds, isUpdating } = useUpdateApplicationAndInterviewRounds(application_id, userId);

  // local states
  const [isEditing, setIsEditing] = useState(false);
  const { data: applicationReview } = useApplicationReview(application_id);
  const { upsertApplicationReview, isUpdating: isUpdatingReview } = useUpsertApplicationReview(application_id, userId);
  const { deleteApplicationReview, isDeleting: isDeletingReview } = useDeleteApplicationReview(application_id, userId);
  const { isOpen: isDeleteReviewModalOpen, onOpen: onDeleteReviewModalOpen, onClose: onDeleteReviewModalClose } = useDisclosure();
  const [reviewDraft, setReviewDraft] = useState("");
  const [hasHydratedReview, setHasHydratedReview] = useState(false);

  useEffect(() => {
    if (hasHydratedReview) return;
    if (applicationReview === undefined) return;

    setReviewDraft(applicationReview?.content ?? "");
    setHasHydratedReview(true);
  }, [applicationReview, hasHydratedReview]);

  if (isLoading || interviewRoundsLoading) return <LoadingContent />;
  if (error || interviewRoundsError) {
    if (isRateLimitError(error) || isRateLimitError(interviewRoundsError)) {
      return <RateLimitErrorMessage />;
    }

    return <ErrorMessageContent message="Failed to load data" />;
  }
  if (!applicationDetails) return <DataNotFoundMessage message="Application not found" />;
  if (!interviewRounds) return <DataNotFoundMessage message="Interview rounds not found" />;

  const handleBackClick = () => {
    router.push(`/job/${applicationDetails.job_posting_id}`);

    mixpanel.track("back_button_clicked", {
      page: "interview_experience_page",
      application_id: application_id,
    });
  };

  const handleSaveForm = async (data: InterviewExperienceFormValues) => {
    // console.log("save data...", data);
    try {
      await updateApplicationAndInterviewRounds(data);

      mixpanel.track("Interview Experience Page", {
        action: "update_interview_experience_success",
        data,
      });

      toast.success("Interview experience updated successfully");
    } catch (error) {
      if (isRateLimitError(error)) {
        toast.error(ERROR_MESSAGES.TOO_MANY_REQUESTS);

        return;
      }

      mixpanel.track("Interview Experience Page", {
        action: "update_interview_experience_error",
        application_id: application_id,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
      console.error("Error updating interview experience:", error);
      toast.error("Error updating interview experience");
    }

    setIsEditing(false);
  };

  const handleEditInterviewRoundsButtonClick = () => {
    mixpanel.track("Interview Experience Page", {
      action: "edit_interview_rounds_button_clicked",
      application_id: application_id,
    });
    setIsEditing(true);
  };

  const handleSaveReview = async () => {
    try {
      await upsertApplicationReview(reviewDraft);
      const reviewTransition = applicationReview?.content ? "updated" : "added";

      mixpanel.track("Interview Experience Page - Public Review Saved", {
        action: "review_saved",
        application_id: application_id,
        job_id: applicationDetails.job_posting_id,
        job_title: applicationDetails.job_posting.title,
        company_name: applicationDetails.job_posting.company.company_name,
        review_content: reviewDraft,
        review_transition: reviewTransition,
      });
      toast.success("Review saved");
    } catch {
      toast.error("Failed to save review");
    }
  };

  const handleDeleteReview = async () => {
    try {
      await deleteApplicationReview();
      setReviewDraft("");

      mixpanel.track("Interview Experience Page - Public Review Deleted", {
        action: "review_deleted",
        application_id: application_id,
        job_id: applicationDetails.job_posting_id,
        job_title: applicationDetails.job_posting.title,
        company_name: applicationDetails.job_posting.company.company_name,
      });
      toast.success("Review deleted");
    } catch {
      toast.error("Failed to delete review");
    }
    onDeleteReviewModalClose();
  };

  return (
    <div className="">
      <CustomButton className="px-0" color="primary" startContent={<ArrowLeftIcon />} variant="light" onPress={handleBackClick}>
        Back to job
      </CustomButton>

      {applicationDetails.isCurrentUserItem ? (
        <Card className="mb-8">
          <CardHeader>
            <div>
              <p className="text-base font-semibold">Public review</p>
              <p className="text-sm text-default-500">Share a short review for other applicants. This will be visible publicly.</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3">
            <Textarea minRows={4} placeholder="Write your review..." value={reviewDraft} onValueChange={setReviewDraft} />
            <div className="flex justify-end gap-2">
              {applicationReview?.content && (
                <CustomButton color="danger" isLoading={isDeletingReview} variant="light" onPress={onDeleteReviewModalOpen}>
                  Delete review
                </CustomButton>
              )}
              <CustomButton color="primary" isDisabled={!reviewDraft.trim()} isLoading={isUpdatingReview} onPress={handleSaveReview}>
                Save review
              </CustomButton>
            </div>
          </CardBody>
        </Card>
      ) : applicationReview ? (
        <Card className="mb-8">
          <CardHeader className="flex flex-col items-start gap-3">
            <p className="text-base font-semibold">Review</p>
            <div className="flex items-center gap-3">
              <Avatar isBordered src={applicationDetails.user_data.profile_pic_url} />
              <div>
                <p className="text-sm font-medium">{applicationDetails.user_data.full_name}</p>
                <p className="text-xs text-default-500">{formatHowLongAgo(applicationReview.created_at)}</p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <p className="whitespace-pre-wrap text-sm text-default-700">{applicationReview.content}</p>
          </CardBody>
        </Card>
      ) : null}

      {isEditing ? (
        <EditInterviewDetails applicationDetails={applicationDetails} interviewRounds={interviewRounds} isUpdating={isUpdating} onCancel={() => setIsEditing(false)} onSave={handleSaveForm} />
      ) : (
        <ViewInterviewDetails
          applicationDetails={applicationDetails}
          interviewRounds={interviewRounds}
          onEdit={applicationDetails.isCurrentUserItem ? handleEditInterviewRoundsButtonClick : undefined}
        />
      )}

      <Spacer y={8} />

      <CommentSection entity_id={application_id} entity_type="interview_experience" />

      <Modal isOpen={isDeleteReviewModalOpen} placement="center" onClose={onDeleteReviewModalClose}>
        <ModalContent>
          <ModalHeader>Delete review</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">Are you sure you want to delete your public review? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <CustomButton color="default" variant="light" onPress={onDeleteReviewModalClose}>
              Cancel
            </CustomButton>
            <CustomButton color="danger" isLoading={isDeletingReview} onPress={handleDeleteReview}>
              Delete
            </CustomButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
