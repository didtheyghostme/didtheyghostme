import { DropdownTrigger, Dropdown, Button, DropdownItem, DropdownMenu, Selection } from "@nextui-org/react";
import useSWR from "swr";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import { useRouter } from "next/navigation";

import { sortOptions, SORT_OPTION_KEYS, SortOption, sortApplicationsByDateTime } from "./OnlineAssessmentContent";
import { ApplicationCard } from "./ApplicationCard";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { ChevronDownIcon } from "@/components/icons";
import { JobPostPageInterviewData } from "@/app/api/job/[job_posting_id]/interview/route";

type InterviewExperienceContentProps = {
  job_posting_id: string;
};

export function InterviewExperienceContent({ job_posting_id }: InterviewExperienceContentProps) {
  const [sort, setSort] = useQueryState("expSort", parseAsStringLiteral(SORT_OPTION_KEYS).withDefault("newest"));

  const { data: applicationsWithCounts, error, isLoading } = useSWR<JobPostPageInterviewData[]>(API.INTERVIEW.getAllByJobPostingId(job_posting_id), fetcher);

  console.log("applications@@@@@@@ for interview experiences", applicationsWithCounts);

  const router = useRouter();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading interview experiences</div>;
  if (!applicationsWithCounts || applicationsWithCounts.length === 0) return <div>No interview experiences found</div>;

  const sortedApplications = sortApplicationsByDateTime(applicationsWithCounts, sort);

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

      {sortedApplications.map((application) => (
        <ApplicationCard key={application.id} application={application} onCardClick={() => handleCardClick(application.id)} />
      ))}
    </div>
  );
}
