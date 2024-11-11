import { Card, CardHeader, Avatar } from "@nextui-org/react";
import { motion } from "framer-motion";

import { formatHowLongAgo } from "@/lib/formatDateUtils";
import { JobPostPageInterviewData } from "@/app/api/job/[job_posting_id]/interview/route";
import { utilSortInterviewTags } from "@/app/interview/[application_id]/InterviewTagsModal";
import { CustomChip } from "@/components/CustomChip";

export function getStatusColor(status: ApplicationStatus): "primary" | "danger" | "warning" | "success" {
  switch (status) {
    case "Applied":
    case "Interviewing":
      return "primary";
    case "Rejected":
      return "danger";
    case "Ghosted":
      return "warning";
    case "Offered":
      return "success";
    default:
      return "primary"; // fallback color
  }
}

type ApplicationCardProps = {
  application: JobPostPageInterviewData;
  onCardClick: () => void;
};

export function ApplicationCard({ application, onCardClick }: ApplicationCardProps) {
  // console.log("this interview experience", application);

  const CardContent = (
    <Card isPressable className="dark:bg-content1-dark w-full border border-gray-200 bg-content1 dark:border-gray-700" onPress={onCardClick}>
      <CardHeader className="flex items-start justify-between p-4">
        <div className="flex w-full flex-col gap-2">
          {/* first row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-base font-medium text-default-500"> Status: </p>
              <CustomChip color={getStatusColor(application.status)} size="sm" variant="flat">
                {application.status}
              </CustomChip>
              <div className="self-stretch border-r border-divider" />
              <span className="font-semibold">
                {application.number_of_rounds} {application.number_of_rounds === 1 ? "round" : "rounds"}
              </span>
            </div>

            <span className="whitespace-nowrap text-tiny text-default-400">{formatHowLongAgo(application.created_at)}</span>
          </div>

          {/* second row */}
          {application.interview_tags && (
            <div className="flex flex-wrap gap-2">
              {utilSortInterviewTags(application.interview_tags).map((tag) => (
                <CustomChip key={tag} color="secondary" size="sm" variant="flat">
                  {tag}
                </CustomChip>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <div className="flex w-full items-center justify-between bg-default-100 px-4 py-3 dark:bg-default-50">
        <div className="flex items-center gap-2">
          <Avatar className="flex-shrink-0" name={application.full_name} size="sm" src={application.profile_pic_url} />
          <span className="text-small text-default-500">{application.full_name}</span>
        </div>

        <div className="flex flex-col items-end text-sm text-gray-500">
          <span>
            {application.number_of_comments} {application.number_of_comments === 1 ? "comment" : "comments"}
          </span>
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
