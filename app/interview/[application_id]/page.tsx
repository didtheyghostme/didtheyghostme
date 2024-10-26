"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Button, Spacer } from "@nextui-org/react";
import { useState } from "react";
import { toast } from "sonner";

import { ViewInterviewDetails } from "./ViewInterviewDetails";
import { EditInterviewDetails } from "./EditInterviewDetails";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { ArrowLeftIcon } from "@/components/icons";
import { useUpdateInterviewRounds } from "@/lib/hooks/useUpdateInterviewRounds";
import { useUpdateApplicationDetails } from "@/lib/hooks/useUpdateApplicationDetails";
import { INTERVIEW_FORM_ID, InterviewExperienceFormValues } from "@/lib/schema/updateInterviewRoundSchema";
import { InterviewExperienceCardData } from "@/lib/sharedTypes";
import { GetApplicationByIdResponse } from "@/app/api/application/[application_id]/route";

export default function InterviewExperiencePage() {
  const { application_id } = useParams();
  const router = useRouter();

  // Fetch application details
  const { data: applicationDetails, error, isLoading } = useSWR<GetApplicationByIdResponse>(API.APPLICATION.getByApplicationId(application_id as string), fetcher);

  const { updateApplicationDetails } = useUpdateApplicationDetails(application_id as string);

  // Fetch interview rounds
  const {
    data: interviewRounds,
    error: interviewRoundsError,
    isLoading: interviewRoundsLoading,
  } = useSWR<InterviewExperienceCardData[]>(API.INTERVIEW.getAllByApplicationId(application_id as string), fetcher);

  const { updateInterviewRounds, isUpdatingInterviewRounds } = useUpdateInterviewRounds(application_id as string);

  // local states
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading || interviewRoundsLoading) return <div>Loading...</div>;
  if (error || interviewRoundsError) return <div>Error loading application details</div>;
  if (!applicationDetails) return <div>Application not found</div>;
  if (!interviewRounds) return <div>Interview rounds not found</div>;

  const handleBackClick = () => {
    router.back();
  };

  const handleSaveForm = async (data: InterviewExperienceFormValues) => {
    console.log("save data...", data);
    try {
      const { applied_date, first_response_date, status, interviewRounds } = data;

      await updateApplicationDetails({ applied_date, first_response_date, status });
      await updateInterviewRounds(interviewRounds);

      toast.success("Interview experience updated successfully");
    } catch (error) {
      console.error("Error updating interview experience:", error);
      toast.error("Error updating interview experience");
    }

    setIsEditing(false);
  };

  return (
    <div className="mx-auto max-w-[1024px]">
      <Button className="mb-4" color="primary" startContent={<ArrowLeftIcon />} variant="light" onPress={handleBackClick}>
        Back to job
      </Button>

      <div className="flex justify-between">
        <h1 className="mb-4 text-3xl font-bold">Interview Experience</h1>
        {applicationDetails.isCurrentUserItem && (
          <>
            {isEditing ? (
              <div className="space-x-2">
                <Button color="primary" form={INTERVIEW_FORM_ID} isLoading={isUpdatingInterviewRounds} type="submit">
                  Save
                </Button>
                <Button color="secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button color="primary" onClick={() => setIsEditing(true)}>
                Edit Interview Rounds
              </Button>
            )}
          </>
        )}
      </div>

      {isEditing ? (
        <EditInterviewDetails applicationDetails={applicationDetails} interviewRounds={interviewRounds} onSave={handleSaveForm} />
      ) : (
        <ViewInterviewDetails applicationDetails={applicationDetails} interviewRounds={interviewRounds} />
      )}

      <Spacer y={4} />
    </div>
  );
}
