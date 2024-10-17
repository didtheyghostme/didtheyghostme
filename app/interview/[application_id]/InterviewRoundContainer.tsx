"use client";

import useSWR from "swr";

import { InterviewRoundForm } from "./InterviewRoundForm";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { InterviewRoundSchema } from "@/lib/schema/addInterviewRoundSchema";
import { useUpdateInterviewRounds } from "@/lib/hooks/useUpdateInterviewRounds";

type InterviewRoundContainerProps = {
  application_id: string;
  isEditing: boolean;
};

export function InterviewRoundContainer({ application_id, isEditing }: InterviewRoundContainerProps) {
  const { updateInterviewRounds, isUpdatingInterviewRounds } = useUpdateInterviewRounds(application_id);

  const { data: interviewRounds, error: interviewRoundsError, isLoading: interviewRoundsLoading } = useSWR<InterviewExperienceTable[]>(API.INTERVIEW.getAllByApplicationId(application_id), fetcher);

  if (interviewRoundsLoading) return <div>Loading interview rounds...</div>;
  if (interviewRoundsError) return <div>Error loading interview rounds</div>;
  if (!interviewRounds) return <div>No interview rounds found</div>;

  const handleInterviewRoundSubmit = async (data: InterviewRoundSchema[]) => {
    console.log("interview round submitted", data);

    try {
      const result = await updateInterviewRounds(data);

      console.log("Interview rounds updated successfully", result);
      //TODO: install sonner toast to show success message
    } catch (error) {
      console.error("Failed to update interview rounds:", error);
    }
  };

  return (
    <div>
      <div className="mb-4 text-2xl font-semibold">Interview Rounds</div>

      <InterviewRoundForm initialData={interviewRounds} isEditing={isEditing} onSubmit={handleInterviewRoundSubmit} />
      {/* TODO: Add interview rounds display here */}

      {/* TODO: interviews.map(interview) here */}
      {/* {interviewRounds.map((round) => (
        <Card key={round.id} className="mb-4">
          <CardHeader>
            <h3 className="text-xl font-semibold">Round {round.round_no}</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <span>
              Difficulty: <Chip color={applicationDetails.status === "Applied" ? "success" : applicationDetails.status === "Interviewing" ? "warning" : "danger"}>Medium</Chip>
            </span>
            {round.response_date && <p>Response Date: {formatDate(round.response_date)}</p>}
            <p>Description:{round.description}</p>

            <p>Date: {new Date(applicationDetails.created_at).toLocaleDateString()}</p>
          </CardBody>
        </Card>
      ))} */}
    </div>
  );
}
