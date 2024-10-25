import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Selection } from "@nextui-org/react";
import useSWR from "swr";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import { useRouter } from "next/navigation";

import { InterviewExperienceCard } from "./InterviewExperienceCard";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { JOB_POST_PAGE_TABS } from "@/lib/constants/jobPostPageTabs";
import { ChevronDownIcon } from "@/components/icons";
import { JobPostPageInterviewData } from "@/lib/sharedTypes";

export const sortOptions = [
  { key: "newest", label: "Date posted: Newest to Oldest" },
  { key: "oldest", label: "Date posted: Oldest to Newest" },
] as const;

export const SORT_OPTION_KEYS = sortOptions.map((option) => option.key);

export type SortOption = (typeof sortOptions)[number];

export function sortAssessmentsByDateTime(assessments: JobPostPageInterviewData[], sortOrder: SortOption["key"]) {
  return [...assessments].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    const compareResult = dateA - dateB;

    return sortOrder === "newest" ? -compareResult : compareResult;
  });
}

type OnlineAssessmentContentProps = {
  job_posting_id: string;
};

export function OnlineAssessmentContent({ job_posting_id }: OnlineAssessmentContentProps) {
  const [sort, setSort] = useQueryState("oaSort", parseAsStringLiteral(SORT_OPTION_KEYS).withDefault("newest"));

  const { data: interviewExperiences, error, isLoading } = useSWR<JobPostPageInterviewData[]>(API.INTERVIEW.getAllByJobPostingId(job_posting_id), fetcher);

  const router = useRouter();

  console.warn("interviewExperiences", interviewExperiences);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading online assessments</div>;
  if (!interviewExperiences || interviewExperiences.length === 0) return <div>No interview assessments found</div>;

  const onlineAssessments = interviewExperiences.filter((exp) => exp.interview_tags?.includes(JOB_POST_PAGE_TABS.ONLINE_ASSESSMENT));

  if (onlineAssessments.length === 0) return <div>No online assessments have been added yet</div>;

  const sortedAssessments = sortAssessmentsByDateTime(onlineAssessments, sort);

  const handleSortChange = (keys: Selection) => {
    const selectedKey = Array.from(keys)[0];

    if (typeof selectedKey === "string" && SORT_OPTION_KEYS.includes(selectedKey as SortOption["key"])) {
      setSort(selectedKey as SortOption["key"]);
    }
  };

  const handleCardClick = (application_id: string) => {
    router.push(`/interview/${application_id}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <Dropdown>
          <DropdownTrigger>
            <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
              Sort by
            </Button>
          </DropdownTrigger>
          <DropdownMenu disallowEmptySelection aria-label="Sort options" selectedKeys={new Set([sort])} selectionMode="single" onSelectionChange={handleSortChange}>
            {sortOptions.map((option) => (
              <DropdownItem key={option.key}>{option.label}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      {sortedAssessments.map((interviewExperience) => (
        <InterviewExperienceCard key={interviewExperience.id} interviewExperience={interviewExperience} onCardClick={() => handleCardClick(interviewExperience.application.id)} />
      ))}
    </div>
  );
}
