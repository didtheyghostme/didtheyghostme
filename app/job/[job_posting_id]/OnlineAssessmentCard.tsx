import { Card, CardBody, CardHeader, Avatar, Tooltip, Chip } from "@nextui-org/react";
import { motion } from "framer-motion";

import { formatDateDayMonthYear, formatHowLongAgo } from "@/lib/formatDateUtils";
import { CalendarIcon } from "@/components/icons";
import { GetOnlineAssessmentsByJobPostingIdResponse } from "@/app/api/job/[job_posting_id]/interview/online/route";
import { LEETCODE_DIFFICULTY } from "@/lib/sharedTypes";
import { utilSortLeetcodeQuestionsDifficulty } from "@/lib/sharedTypes";
import { utilSortInterviewTags } from "@/app/interview/[application_id]/InterviewTagsModal";
import { InterviewTagsAndLeetcodeChips } from "./InterviewTagsAndLeetcodeChips";

type OnlineAssessmentCardProps = {
  application: GetOnlineAssessmentsByJobPostingIdResponse;
  onCardClick: () => void;
};

export function OnlineAssessmentCard({ application, onCardClick }: OnlineAssessmentCardProps) {
  console.log("this online assessment experience", application);

  const CardContent = (
    <Card isPressable className="dark:bg-content1-dark w-full border border-gray-200 bg-content1 dark:border-gray-700" onPress={onCardClick}>
      <CardHeader className="flex items-start justify-between p-4">
        <div className="flex w-full flex-col gap-2">
          {/* first row */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <p className="text-base font-semibold">Round {application.round_no} </p>
            </div>

            <span className="whitespace-nowrap text-tiny text-default-400">{formatHowLongAgo(application.created_at)}</span>
          </div>

          {/* third row */}
          <div className="flex flex-col text-small text-default-400">
            <div className="flex items-center gap-1">
              <CalendarIcon />
              <Tooltip content={formatHowLongAgo(application.interview_date)}>
                <span className="w-fit">Interview date: {formatDateDayMonthYear(application.interview_date)}</span>
              </Tooltip>
            </div>
            {application.response_date && (
              <div className="flex items-center gap-1">
                <CalendarIcon />
                <Tooltip content={formatHowLongAgo(application.response_date)}>
                  <span className="w-fit">Receive response: {formatDateDayMonthYear(application.response_date)}</span>
                </Tooltip>
              </div>
            )}
          </div>

          <InterviewTagsAndLeetcodeChips interview_tags={application.interview_tags} leetcode_questions={application.leetcode_questions} />
        </div>
      </CardHeader>

      <CardBody className="gap-2 p-4">
        <p className="whitespace-pre-wrap text-default-600">{application.description}</p>
      </CardBody>

      <div className="flex w-full items-center justify-between bg-default-100 px-4 py-3 dark:bg-default-50">
        <div className="flex items-center gap-2">
          <Avatar className="flex-shrink-0" name={application.user_data.full_name} size="sm" src={application.user_data.profile_pic_url} />
          <span className="text-small text-default-500">{application.user_data.full_name}</span>
        </div>
      </div>
    </Card>
  );

  return (
    <motion.div transition={{ type: "spring", stiffness: 300 }} whileHover={{ scale: 1.02 }}>
      {CardContent}
    </motion.div>
  );
}
