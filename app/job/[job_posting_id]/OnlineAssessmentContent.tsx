import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Selection } from "@nextui-org/react";
import useSWR from "swr";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import { useRouter } from "next/navigation";

import { OnlineAssessmentCard } from "./OnlineAssessmentCard";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { ChevronDownIcon } from "@/components/icons";
import { GetOnlineAssessmentsByJobPostingIdResponse } from "@/app/api/job/[job_posting_id]/interview/online/route";

export const sortOptions = [
  { key: "newest", label: "Date posted: Newest to Oldest" },
  { key: "oldest", label: "Date posted: Oldest to Newest" },
] as const;

export const SORT_OPTION_KEYS = sortOptions.map((option) => option.key);

export type SortOption = (typeof sortOptions)[number];

export function sortApplicationsByDateTime<T extends { created_at: string }>(applications: T[], sortOrder: SortOption["key"]) {
  return [...applications].sort((a, b) => {
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

  const { data: onlineAssessments, error, isLoading } = useSWR<GetOnlineAssessmentsByJobPostingIdResponse[]>(API.INTERVIEW.getOnlineAssessmentsByJobPostingId(job_posting_id), fetcher);

  const router = useRouter();

  console.warn("onlineAssessments", onlineAssessments);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading online assessments</div>;
  if (!onlineAssessments || onlineAssessments.length === 0) return <div>No interview assessments found</div>;

  if (onlineAssessments.length === 0) return <div>No online assessments have been added yet</div>;

  const sortedOnlineAssessments = sortApplicationsByDateTime(onlineAssessments, sort);

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

      {sortedOnlineAssessments.map((onlineAssessment) => (
        <OnlineAssessmentCard key={onlineAssessment.id} application={onlineAssessment} onCardClick={() => handleCardClick(onlineAssessment.application.id)} />
      ))}
    </div>
  );
}
