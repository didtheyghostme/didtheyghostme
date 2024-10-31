import { Card, CardBody, CardHeader, Chip, Avatar, Tooltip } from "@nextui-org/react";
import { motion } from "framer-motion";

import { formatDateDayMonthYear, formatHowLongAgo } from "@/lib/formatDateUtils";
import { CalendarIcon } from "@/components/icons";
import { JobPostPageInterviewData } from "@/app/api/job/[job_posting_id]/interview/route";

type ApplicationCardProps = {
  application: JobPostPageInterviewData;
  onCardClick?: () => void;
};

export function ApplicationCard({ application, onCardClick }: ApplicationCardProps) {
  console.log("this interview experience", application);

  const CardContent = (
    <Card isPressable className="dark:bg-content1-dark w-full border border-gray-200 bg-content1 dark:border-gray-700" onPress={onCardClick}>
      <CardHeader className="flex items-start justify-between p-4">
        <div className="flex w-full flex-col gap-2">
          {/* first row */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <p className="text-base font-semibold">Round {application.number_of_rounds} </p>
              <Chip color="danger" size="sm" variant="flat">
                {application.status}
              </Chip>
            </div>

            <span className="whitespace-nowrap text-tiny text-default-400">{formatHowLongAgo(application.created_at)}</span>
          </div>

          {/* second row */}
          <div className="flex flex-wrap gap-2">
            {application.interview_tags?.map((tag) => (
              <Chip key={tag} color="secondary" size="sm" variant="flat">
                {tag}
              </Chip>
            ))}
          </div>

          {/* third row */}
          <div className="flex flex-col text-small text-default-400">
            <div className="flex items-center gap-1">
              <CalendarIcon />
              <Tooltip content={formatHowLongAgo(application.applied_date)}>
                <span className="w-fit">Applied: {formatDateDayMonthYear(application.applied_date)}</span>
              </Tooltip>
            </div>
            {application.first_response_date && (
              <div className="flex items-center gap-1">
                <CalendarIcon />
                <Tooltip content={formatHowLongAgo(application.first_response_date)}>
                  <span className="w-fit">Receive response: {formatDateDayMonthYear(application.first_response_date)}</span>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="gap-2 p-4">
        <p className="text-default-600">{application.number_of_rounds} rounds</p>
        <p className="text-default-600">{application.number_of_comments} comments</p>
      </CardBody>

      <div className="flex items-center justify-between bg-default-100 px-4 py-3 dark:bg-default-50">
        <div className="flex items-center gap-2">
          <Avatar className="flex-shrink-0" name={application.full_name} size="sm" src={application.profile_pic_url} />
          <span className="text-small text-default-500">{application.full_name}</span>
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
