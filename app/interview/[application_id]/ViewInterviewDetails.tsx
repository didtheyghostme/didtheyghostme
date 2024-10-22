import { Card, CardBody, CardHeader, Divider, Chip } from "@nextui-org/react";

import { formatDate } from "@/lib/formatDate";
import { InterviewExperienceCardData } from "@/lib/sharedTypes";
import { InterviewExperienceCard } from "@/app/job/[job_posting_id]/InterviewExperienceCard";

type ViewInterviewDetailsProps = {
  applicationDetails: ProcessedApplication;
  interviewRounds: InterviewExperienceCardData[];
};

export function ViewInterviewDetails({ applicationDetails, interviewRounds }: ViewInterviewDetailsProps) {
  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-2xl font-semibold">title</h2>
          <p className="text-default-500">company_name</p>
        </CardHeader>
        <Divider />
        <CardBody>
          <p>Applied on: {applicationDetails.applied_date}</p>
          <div>
            <span>Status:</span> <Chip color="primary">{applicationDetails.status}</Chip>
          </div>
          {applicationDetails.first_response_date && <p>First response date: {formatDate(applicationDetails.first_response_date)}</p>}
          {!applicationDetails.first_response_date && <p>No first response date set</p>}
        </CardBody>
      </Card>

      {/* TODO: interviews.map(interview) here */}
      <div className="flex flex-col gap-4">
        {interviewRounds.map((round) => (
          <InterviewExperienceCard key={round.id} interviewExperience={round} />
        ))}
      </div>
    </>
  );
}
