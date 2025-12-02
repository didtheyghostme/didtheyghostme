import { Card, CardBody, CardHeader, Avatar, Tooltip } from "@heroui/react";

import { InterviewTagsAndLeetcodeChips } from "./InterviewTagsAndLeetcodeChips";

import { formatDateDayMonthYear, formatHowLongAgo, getDaysBetween } from "@/lib/formatDateUtils";
import { CalendarIcon } from "@/components/icons";
import { InterviewExperienceCardData } from "@/lib/sharedTypes";

type InterviewExperienceCardProps = {
  interviewExperience: InterviewExperienceCardData;
  appliedDate: string;
};

export function InterviewExperienceCard({ interviewExperience, appliedDate }: InterviewExperienceCardProps) {
  // console.log("this interview experience", interviewExperience);

  return (
    <Card className="dark:bg-content1-dark w-full border border-gray-200 bg-content1 dark:border-gray-700">
      <CardHeader className="flex items-start justify-between p-4">
        <div className="flex w-full flex-col gap-2">
          {/* first row - round number and created at */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <p className="text-base font-semibold">Round {interviewExperience.round_no} </p>
            </div>

            <span className="whitespace-nowrap text-tiny text-default-400">{formatHowLongAgo(interviewExperience.created_at)}</span>
          </div>

          {/* second row - interview tags and leetcode questions */}
          <InterviewTagsAndLeetcodeChips interview_tags={interviewExperience.interview_tags} leetcode_questions={interviewExperience.leetcode_questions} />

          {/* third row - interview date and response date */}
          <div className="flex flex-col text-small text-default-400">
            <div className="flex items-center gap-1">
              <CalendarIcon />
              <span>
                Interviewed:{" "}
                <Tooltip content={formatHowLongAgo(interviewExperience.interview_date)}>
                  <span>
                    {formatDateDayMonthYear(interviewExperience.interview_date)} (Day {getDaysBetween(appliedDate, interviewExperience.interview_date)})
                  </span>
                </Tooltip>
              </span>
            </div>

            <div className="flex items-center gap-1 text-default-400">
              <CalendarIcon />
              {interviewExperience.response_date ? (
                <span>
                  Receive response:{" "}
                  <Tooltip content={formatHowLongAgo(interviewExperience.response_date)}>
                    <span>
                      {formatDateDayMonthYear(interviewExperience.response_date)} (Day {getDaysBetween(appliedDate, interviewExperience.response_date)})
                    </span>
                  </Tooltip>
                </span>
              ) : (
                <span>No response date yet</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardBody className="gap-2 p-4">
        <p className="whitespace-pre-wrap text-default-600">{interviewExperience.description}</p>
      </CardBody>

      <div className="flex w-full items-center justify-between bg-default-100 px-4 py-3 dark:bg-default-50">
        <div className="flex items-center gap-2">
          <Avatar className="flex-shrink-0" name={interviewExperience.user_data.full_name} size="sm" src={interviewExperience.user_data.profile_pic_url} />
          <span className="text-small text-default-500">{interviewExperience.user_data.full_name}</span>
        </div>
      </div>
    </Card>
  );
}
