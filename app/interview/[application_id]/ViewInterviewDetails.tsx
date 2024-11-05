import { Card, CardBody, CardHeader, Divider, Chip } from "@nextui-org/react";

import { InterviewExperienceCardData } from "@/lib/sharedTypes";
import { InterviewExperienceCard } from "@/app/job/[job_posting_id]/InterviewExperienceCard";
import { formatDateDayMonthYear } from "@/lib/formatDateUtils";
import { getStatusColor } from "@/app/job/[job_posting_id]/ApplicationCard";
import { GetApplicationByIdResponse } from "@/app/api/application/[application_id]/route";
import ImageWithFallback from "@/components/ImageWithFallback";

type ViewInterviewDetailsProps = {
  applicationDetails: GetApplicationByIdResponse;
  interviewRounds: InterviewExperienceCardData[];
};

export function ViewInterviewDetails({ applicationDetails, interviewRounds }: ViewInterviewDetailsProps) {
  console.warn("interviewRounds", interviewRounds);

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <ImageWithFallback
                alt={applicationDetails.job_posting.company.company_name}
                className="h-12 w-12 rounded-lg object-cover"
                companyName={applicationDetails.job_posting.company.company_name}
                src={applicationDetails.job_posting.company.logo_url}
              />
            </div>
            <div>
              <h2 className="text-lg">{applicationDetails.job_posting.title}</h2>
              <p className="text-default-500">{applicationDetails.job_posting.company.company_name}</p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <div>
            <span>Status:</span>
            <Chip color={getStatusColor(applicationDetails.status)} variant="flat">
              {applicationDetails.status}
            </Chip>
          </div>
          <p>Applied on: {applicationDetails.applied_date}</p>

          {applicationDetails.first_response_date && <p>First response date: {formatDateDayMonthYear(applicationDetails.first_response_date)}</p>}

          {!applicationDetails.first_response_date && <p>No first response date set</p>}
        </CardBody>
      </Card>

      {interviewRounds.length === 0 && <p className="text-center text-default-500">There are no interviews yet</p>}

      {interviewRounds.length > 0 && (
        <div className="flex flex-col gap-4">
          {interviewRounds.map((round) => (
            <InterviewExperienceCard key={round.id} interviewExperience={round} />
          ))}
        </div>
      )}
    </>
  );
}
