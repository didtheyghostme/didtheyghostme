import { Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import useSWR from "swr";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { JOB_POST_PAGE_TABS } from "@/lib/constants/jobPostPageTabs";

type InterviewExperienceContentProps = {
  job_posting_id: string;
};

export function InterviewExperienceContent({ job_posting_id }: InterviewExperienceContentProps) {
  const { data: interviewExperiences, error, isLoading } = useSWR<InterviewExperienceTable[]>(API.INTERVIEW.getAllByJobPostingId(job_posting_id), fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading interview experiences</div>;
  if (!interviewExperiences || interviewExperiences.length === 0) return <div>No interview experiences found</div>;

  const filteredExperiences = interviewExperiences.filter((exp) => !exp.interview_tags?.includes(JOB_POST_PAGE_TABS.ONLINE_ASSESSMENT));

  if (filteredExperiences.length === 0) return <div>No interview experiences have been added yet</div>;

  return (
    <div className="flex flex-wrap gap-4">
      {filteredExperiences.map((interviewExperience) => (
        <Card key={interviewExperience.id} isPressable className="w-full sm:w-[calc(50%-0.5rem)]">
          <CardHeader>
            <h2 className="text-xl font-bold">
              Round {interviewExperience.round_no} - {new Date(interviewExperience.interview_date).toLocaleDateString()}
            </h2>
          </CardHeader>
          <CardBody>
            <p>{interviewExperience.description}</p>
            <p>Difficulty: {interviewExperience.difficulty}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {interviewExperience.interview_tags?.map((tag) => (
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
