import { Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import useSWR from "swr";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { JOB_POST_PAGE_TABS } from "@/lib/constants/jobPostPageTabs";

type OnlineAssessmentContentProps = {
  job_posting_id: string;
};

export function OnlineAssessmentContent({ job_posting_id }: OnlineAssessmentContentProps) {
  const { data: interviewExperiences, error, isLoading } = useSWR<InterviewExperienceTable[]>(API.INTERVIEW.getAllByJobPostingId(job_posting_id), fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading online assessments</div>;
  if (!interviewExperiences || interviewExperiences.length === 0) return <div>No interview assessments found</div>;

  const onlineAssessments = interviewExperiences.filter((exp) => exp.interview_tags?.includes(JOB_POST_PAGE_TABS.ONLINE_ASSESSMENT));

  if (onlineAssessments.length === 0) return <div>No online assessments have been added yet</div>;

  return (
    <div className="flex flex-wrap gap-4">
      {onlineAssessments.map((assessment) => (
        <Card key={assessment.id} isPressable className="w-full sm:w-[calc(50%-0.5rem)]">
          <CardHeader>
            <h2 className="text-xl font-bold">
              Round {assessment.round_no} - {new Date(assessment.interview_date).toLocaleDateString()}
            </h2>
          </CardHeader>
          <CardBody>
            <p>{assessment.description}</p>
            <p>Difficulty: {assessment.difficulty}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {assessment.interview_tags?.map((tag) => (
                <Chip key={tag} color="primary" variant="flat">
                  {tag}
                </Chip>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
