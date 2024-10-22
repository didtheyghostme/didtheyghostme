import { Card, CardBody, CardHeader, Chip, Avatar, Tooltip } from "@nextui-org/react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

import { DBTable } from "@/lib/constants/dbTables";
import { formatDate } from "@/lib/formatDate";
import { CalendarIcon } from "@/components/icons";
import { InterviewExperienceCardData } from "@/lib/sharedTypes";

type InterviewExperienceCardProps = {
  interviewExperience: InterviewExperienceCardData;
  onCardClick?: () => void;
};

export function InterviewExperienceCard({ interviewExperience, onCardClick }: InterviewExperienceCardProps) {
  console.log("this interview experience", interviewExperience);

  //TODO: 22 Oct Tuesday, move this function to parent component
  // add difficulty selection into the EditInterviewDetails form, change color of the chip based on difficulty green for easy, yellow for medium, red for hard

  const CardContent = (
    <Card className="dark:bg-content1-dark w-full border border-gray-200 bg-content1 dark:border-gray-700" isPressable={!!onCardClick} {...(onCardClick && { onPress: onCardClick })}>
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

            <Tooltip content={`Added ${formatDistanceToNow(new Date(interviewExperience.created_at), { addSuffix: true })}`}>
              <span className="whitespace-nowrap text-tiny text-default-400">{formatDistanceToNow(new Date(interviewExperience.created_at), { addSuffix: true })}</span>
            </Tooltip>
          </div>

          {/* second row */}
          <div className="flex flex-wrap gap-2">
            {interviewExperience.interview_tags?.map((tag) => (
              <Chip key={tag} color="secondary" size="sm" variant="flat">
                {tag}
              </Chip>
            ))}
          </div>

          {/* third row */}
          <div className="flex flex-col text-small text-default-400">
            <div className="flex items-center gap-1">
              <CalendarIcon />
              <Tooltip content={formatDistanceToNow(new Date(interviewExperience.interview_date), { addSuffix: true })}>
                <span className="w-fit">Interviewed: {formatDate(interviewExperience.interview_date)}</span>
              </Tooltip>
            </div>
            {interviewExperience.response_date && (
              <div className="flex items-center gap-1">
                <CalendarIcon />
                <Tooltip content={formatDistanceToNow(new Date(interviewExperience.response_date), { addSuffix: true })}>
                  <span className="w-fit">Receive response: {formatDate(interviewExperience.response_date)}</span>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="gap-2 p-4">
        <p className="text-default-600">{interviewExperience.description}</p>
      </CardBody>

      <div className="flex items-center justify-between bg-default-100 px-4 py-3 dark:bg-default-50">
        <div className="flex items-center gap-2">
          <Avatar name={interviewExperience[DBTable.USER].full_name} size="sm" src={interviewExperience[DBTable.USER].profile_pic_url} />
          <span className="text-small text-default-500">{interviewExperience[DBTable.USER].full_name}</span>
        </div>
      </div>
    </Card>
  );

  if (onCardClick) {
    return (
      <motion.div transition={{ type: "spring", stiffness: 300 }} whileHover={{ scale: 1.02 }}>
        {CardContent}
      </motion.div>
    );
  }

  return CardContent;
}
