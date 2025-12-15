"use client";

import { useParams, useRouter } from "next/navigation";
import { Spacer } from "@heroui/react";
import { useState } from "react";
import { toast } from "sonner";
import mixpanel from "mixpanel-browser";
import { useAuth } from "@clerk/nextjs";

import { ViewInterviewDetails } from "./ViewInterviewDetails";
import { EditInterviewDetails } from "./EditInterviewDetails";

import { API } from "@/lib/constants/apiRoutes";
import { ArrowLeftIcon } from "@/components/icons";
import { INTERVIEW_FORM_ID, InterviewExperienceFormValues } from "@/lib/schema/updateInterviewRoundSchema";
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

  return (
    <div className="">
      <CustomButton className="px-0" color="primary" startContent={<ArrowLeftIcon />} variant="light" onPress={handleBackClick}>
        Back to job
      </CustomButton>

      <div className="flex flex-col items-end pb-4">
        {applicationDetails.isCurrentUserItem && (
          <>
            {isEditing ? (
              <div className="flex gap-2">
                <CustomButton color="primary" form={INTERVIEW_FORM_ID} isLoading={isUpdating} type="submit">
                  Save
                </CustomButton>
                <CustomButton color="secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </CustomButton>
              </div>
            ) : (
              <CustomButton className="self-end sm:self-auto" color="primary" onClick={handleEditInterviewRoundsButtonClick}>
                Edit Interview Rounds
              </CustomButton>
            )}
          </>
        )}
      </div>

      {isEditing ? (
        <EditInterviewDetails applicationDetails={applicationDetails} interviewRounds={interviewRounds} onSave={handleSaveForm} />
      ) : (
        <ViewInterviewDetails applicationDetails={applicationDetails} interviewRounds={interviewRounds} />
      )}

      <Spacer y={8} />

      <CommentSection entity_id={application_id} entity_type="interview_experience" />
    </div>
  );
}
