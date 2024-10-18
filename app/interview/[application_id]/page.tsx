"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Button, Spacer } from "@nextui-org/react";
import { useState } from "react";
import { z } from "zod";

import { ViewInterviewDetails } from "./ViewInterviewDetails";
import { EditInterviewDetails } from "./EditInterviewDetails";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { ArrowLeftIcon } from "@/components/icons";
import { interviewRoundSchema } from "@/lib/schema/addInterviewRoundSchema";
import { useUpdateInterviewRounds } from "@/lib/hooks/useUpdateInterviewRounds";
import { useUpdateApplicationFirstResponseDate } from "@/lib/hooks/useUpdateApplicationFirstResponseDate";

export const UpdateInterviewExperienceSchema = z.object({
  interviewRounds: z.array(interviewRoundSchema),
  first_response_date: z.string().min(1, "First response date is required"),
});

export type InterviewExperienceFormValues = z.infer<typeof UpdateInterviewExperienceSchema>;

export const INTERVIEW_FORM_ID = "interview-form";

export default function InterviewExperiencePage() {
  const { application_id } = useParams();
  const { data: applicationDetails, error, isLoading } = useSWR<ProcessedApplication>(API.APPLICATION.getByApplicationId(application_id as string), fetcher);
  const router = useRouter();

  const {
    data: interviewRounds,
    error: interviewRoundsError,
    isLoading: interviewRoundsLoading,
  } = useSWR<InterviewExperienceTable[]>(API.INTERVIEW.getAllByApplicationId(application_id as string), fetcher);

  const { updateApplicationFirstResponseDate } = useUpdateApplicationFirstResponseDate(application_id as string);

  const { updateInterviewRounds, isUpdatingInterviewRounds } = useUpdateInterviewRounds(application_id as string);

  const [isEditing, setIsEditing] = useState(false);

  if (isLoading || interviewRoundsLoading) return <div>Loading...</div>;
  if (error || interviewRoundsError) return <div>Error loading application details</div>;
  if (!applicationDetails) return <div>Application not found</div>;
  if (!interviewRounds) return <div>Interview rounds not found</div>;

  const handleBackClick = () => {
    router.back();
  };

  const handleSave = async (data: InterviewExperienceFormValues) => {
    console.log("save data...", data);
    //TODO: install sonner toast to show success message
    try {
      await updateApplicationFirstResponseDate(data.first_response_date);
      await updateInterviewRounds(data.interviewRounds);
    } catch (error) {
      console.error("Error updating interview experience:", error);
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
        {isEditing ? (
          <div className="space-x-2">
            <Button color="primary" form={INTERVIEW_FORM_ID} type="submit">
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
      </div>

      {isEditing ? (
        <EditInterviewDetails applicationDetails={applicationDetails} interviewRounds={interviewRounds} onSave={handleSave} />
      ) : (
        <ViewInterviewDetails applicationDetails={applicationDetails} interviewRounds={interviewRounds} />
      )}

      <Spacer y={4} />
    </div>
  );
}
