import { DropdownTrigger, Dropdown, Button, DropdownItem, DropdownMenu, Selection } from "@nextui-org/react";
import useSWR from "swr";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import { useRouter } from "next/navigation";

import { sortAssessmentsByDateTime, sortOptions, SORT_OPTION_KEYS, SortOption } from "./OnlineAssessmentContent";
import { InterviewExperienceCard } from "./InterviewExperienceCard";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { JOB_POST_PAGE_TABS } from "@/lib/constants/jobPostPageTabs";
import { ChevronDownIcon } from "@/components/icons";
import { JobPostPageInterviewData } from "@/lib/sharedTypes";

type InterviewExperienceContentProps = {
  job_posting_id: string;
};

export function InterviewExperienceContent({ job_posting_id }: InterviewExperienceContentProps) {
  const [sort, setSort] = useQueryState("expSort", parseAsStringLiteral(SORT_OPTION_KEYS).withDefault("newest"));

  const { data: interviewExperiences, error, isLoading } = useSWR<JobPostPageInterviewData[]>(API.INTERVIEW.getAllByJobPostingId(job_posting_id), fetcher);

  const router = useRouter();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading interview experiences</div>;
  if (!interviewExperiences || interviewExperiences.length === 0) return <div>No interview experiences found</div>;

  const filteredExperiences = interviewExperiences.filter((exp) => !exp.interview_tags?.includes(JOB_POST_PAGE_TABS.ONLINE_ASSESSMENT));

  if (filteredExperiences.length === 0) return <div>No interview experiences have been added yet</div>;

  const sortedExperiences = sortAssessmentsByDateTime(filteredExperiences, sort);

  function handleSortChange(keys: Selection) {
    const selectedKey = Array.from(keys)[0];

    if (typeof selectedKey === "string" && SORT_OPTION_KEYS.includes(selectedKey as SortOption["key"])) {
      setSort(selectedKey as SortOption["key"]);
    }
  }

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

      {sortedExperiences.map((interviewExperience) => (
        <InterviewExperienceCard key={interviewExperience.id} interviewExperience={interviewExperience} onCardClick={() => handleCardClick(interviewExperience.application.id)} />
      ))}
    </div>
  );
}
