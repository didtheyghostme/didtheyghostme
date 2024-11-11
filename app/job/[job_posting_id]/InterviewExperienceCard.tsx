import { Card, CardBody, CardHeader, Avatar, Tooltip } from "@nextui-org/react";

import { InterviewTagsAndLeetcodeChips } from "./InterviewTagsAndLeetcodeChips";

import { formatDateDayMonthYear, formatHowLongAgo } from "@/lib/formatDateUtils";
import { CalendarIcon } from "@/components/icons";
import { InterviewExperienceCardData } from "@/lib/sharedTypes";

type InterviewExperienceCardProps = {
  interviewExperience: InterviewExperienceCardData;
};

export function InterviewExperienceCard({ interviewExperience }: InterviewExperienceCardProps) {
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
              <Tooltip content={formatHowLongAgo(interviewExperience.interview_date)}>
                <span className="w-fit">Interviewed: {formatDateDayMonthYear(interviewExperience.interview_date)}</span>
              </Tooltip>
            </div>
            {interviewExperience.response_date && (
              <div className="flex items-center gap-1">
                <CalendarIcon />
                <Tooltip content={formatHowLongAgo(interviewExperience.response_date)}>
                  <span className="w-fit">Receive response: {formatDateDayMonthYear(interviewExperience.response_date)}</span>
                </Tooltip>
              </div>
            )}
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
