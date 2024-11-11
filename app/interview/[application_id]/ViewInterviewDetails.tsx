import { Card, CardBody, CardHeader, Divider, Chip } from "@nextui-org/react";

import { InterviewExperienceCardData } from "@/lib/sharedTypes";
import { InterviewExperienceCard } from "@/app/job/[job_posting_id]/InterviewExperienceCard";
import { formatDateDayMonthYear } from "@/lib/formatDateUtils";
import { getStatusColor } from "@/app/job/[job_posting_id]/ApplicationCard";
import { GetApplicationByIdResponse } from "@/app/api/application/[application_id]/route";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { CalendarIcon } from "@/components/icons";

type ViewInterviewDetailsProps = {
  applicationDetails: GetApplicationByIdResponse;
  interviewRounds: InterviewExperienceCardData[];
};

export function ViewInterviewDetails({ applicationDetails, interviewRounds }: ViewInterviewDetailsProps) {
  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 flex-shrink-0">
              <ImageWithFallback
                alt={applicationDetails.job_posting.company.company_name}
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
            <span>Interview status: </span>
            <Chip color={getStatusColor(applicationDetails.status)} variant="flat">
              {applicationDetails.status}
            </Chip>
          </div>
          <div className="flex items-center gap-1 text-default-400">
            <CalendarIcon />
            <p>Applied on: {formatDateDayMonthYear(applicationDetails.applied_date)}</p>
          </div>

          {applicationDetails.first_response_date && (
            <div className="flex items-center gap-1 text-default-400">
              <CalendarIcon />
              <p>First response date: {formatDateDayMonthYear(applicationDetails.first_response_date)}</p>
            </div>
          )}

          {!applicationDetails.first_response_date && (
            <div className="flex items-center gap-1 text-default-400">
              <CalendarIcon />
              <p> No first response date yet</p>
            </div>
          )}
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
