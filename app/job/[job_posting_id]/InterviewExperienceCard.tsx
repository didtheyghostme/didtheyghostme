import { Card, CardBody, CardHeader, Chip, Avatar, Tooltip } from "@nextui-org/react";

import { formatDateDayMonthYear, formatHowLongAgo } from "@/lib/formatDateUtils";
import { CalendarIcon } from "@/components/icons";
import { InterviewExperienceCardData } from "@/lib/sharedTypes";
import { sortInterviewTags } from "@/app/interview/[application_id]/InterviewTagsModal";

type InterviewExperienceCardProps = {
  interviewExperience: InterviewExperienceCardData;
};

export function InterviewExperienceCard({ interviewExperience }: InterviewExperienceCardProps) {
  console.log("this interview experience", interviewExperience);

  // add difficulty selection into the EditInterviewDetails form, change color of the chip based on difficulty green for easy, yellow for medium, red for hard

  return (
    <Card className="dark:bg-content1-dark w-full border border-gray-200 bg-content1 dark:border-gray-700">
      <CardHeader className="flex items-start justify-between p-4">
        <div className="flex w-full flex-col gap-2">
          {/* first row */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <p className="text-base font-semibold">Round {interviewExperience.round_no} </p>
              <Chip color="danger" size="sm" variant="flat">
                {interviewExperience.difficulty} Medium
              </Chip>
            </div>

            <span className="whitespace-nowrap text-tiny text-default-400">{formatHowLongAgo(interviewExperience.created_at)}</span>
          </div>

          {/* second row - interview tags */}
          {interviewExperience.interview_tags && (
            <div className="flex flex-wrap gap-2">
              {sortInterviewTags(interviewExperience.interview_tags).map((tag) => (
                <Chip key={tag} color="secondary" size="sm" variant="flat">
                  {tag}
                </Chip>
              ))}
            </div>
          )}

          {/* third row */}
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

          {/* third row - leetcode questions */}
          {interviewExperience.leetcode_questions && interviewExperience.leetcode_questions.length > 0 && (
            <div className="mt-2">
              <p className="mb-2 text-sm font-semibold">LeetCode Questions:</p>
              <div className="flex flex-wrap gap-2">
                {interviewExperience.leetcode_questions.map((question, index) => (
                  <Chip
                    key={index}
                    // Color based on difficulty
                    color={question.difficulty === "Easy" ? "success" : question.difficulty === "Medium" ? "warning" : "danger"}
                    size="sm"
                    variant="flat"
                  >
                    LC-{question.question_number} ({question.difficulty})
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardBody className="gap-2 p-4">
        <p className="whitespace-pre-wrap text-default-600">{interviewExperience.description}</p>
      </CardBody>

      <div className="flex items-center justify-between bg-default-100 px-4 py-3 dark:bg-default-50">
        <div className="flex items-center gap-2">
          <Avatar className="flex-shrink-0" name={interviewExperience.user_data.full_name} size="sm" src={interviewExperience.user_data.profile_pic_url} />
          <span className="text-small text-default-500">{interviewExperience.user_data.full_name}</span>
        </div>
      </div>
    </Card>
  );
}
