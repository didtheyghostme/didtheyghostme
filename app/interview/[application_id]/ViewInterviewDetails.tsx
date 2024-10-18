import { Card, CardBody, CardHeader, Divider, Chip } from "@nextui-org/react";

import { formatDate } from "@/lib/formatDate";

type ViewInterviewDetailsProps = {
  applicationDetails: ProcessedApplication;
  interviewRounds: InterviewExperienceTable[];
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
      {interviewRounds.map((round) => (
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
      ))}
    </>
  );
}
