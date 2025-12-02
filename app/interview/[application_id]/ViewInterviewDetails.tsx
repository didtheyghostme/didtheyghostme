import { Card, CardBody, CardHeader, Divider, Tooltip } from "@heroui/react";

import { InterviewExperienceCardData } from "@/lib/sharedTypes";
import { InterviewExperienceCard } from "@/app/job/[job_posting_id]/InterviewExperienceCard";
import { formatDateDayMonthYear, formatHowLongAgo, getDaysBetween } from "@/lib/formatDateUtils";
import { getStatusColor } from "@/app/job/[job_posting_id]/ApplicationCard";
import { GetApplicationByIdResponse } from "@/app/api/application/[application_id]/route";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { CalendarIcon } from "@/components/icons";
import { CustomChip } from "@/components/CustomChip";
import { EmptyContent } from "@/components/EmptyContent";

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
            <CustomChip color={getStatusColor(applicationDetails.status)} variant="flat">
              {applicationDetails.status}
            </CustomChip>
          </div>

          <div className="flex items-center gap-1 text-default-400">
            <CalendarIcon />
            <span>
              Applied on:{" "}
              <Tooltip content={formatHowLongAgo(applicationDetails.applied_date)}>
                <span>{formatDateDayMonthYear(applicationDetails.applied_date)}</span>
              </Tooltip>
            </span>
          </div>

          <div className="flex items-center gap-1 text-default-400">
            <CalendarIcon />
            {applicationDetails.first_response_date ? (
              <span>
                First response date:{" "}
                <Tooltip content={formatHowLongAgo(applicationDetails.first_response_date)}>
                  <span>
                    {formatDateDayMonthYear(applicationDetails.first_response_date)} (Day {getDaysBetween(applicationDetails.applied_date, applicationDetails.first_response_date)})
                  </span>
                </Tooltip>
              </span>
            ) : (
              <span>No first response date yet</span>
            )}
          </div>
        </CardBody>
      </Card>

      {interviewRounds.length === 0 && <EmptyContent heading="No interview rounds yet" />}

      {interviewRounds.length > 0 && (
        <div className="flex flex-col gap-4">
          {interviewRounds.map((round) => (
            <InterviewExperienceCard key={round.id} appliedDate={applicationDetails.applied_date} interviewExperience={round} />
          ))}
        </div>
      )}
    </>
  );
}
