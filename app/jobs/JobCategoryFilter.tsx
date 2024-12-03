import { Select, SelectItem } from "@nextui-org/react";

import { JobCategorySelect } from "@/app/api/job-category/route";
import { LoadingContent } from "@/components/LoadingContent";

type JobCategoryFilterProps = {
  onJobCategoryChange: (categoryIds: string[]) => void;
  selectedJobCategoryIds: string[];
  jobCategories: JobCategorySelect[];
  jobCategoriesLoading: boolean;
};

export function JobCategoryFilter({ onJobCategoryChange, selectedJobCategoryIds, jobCategories, jobCategoriesLoading }: JobCategoryFilterProps) {
  if (jobCategoriesLoading) return <LoadingContent />;

  const techId = jobCategories.find((cat) => cat.job_category_name === "Tech")?.id;

  const hasValidSelection = selectedJobCategoryIds.some((id) => id.trim().length > 0);

  const defaultKeys = hasValidSelection ? selectedJobCategoryIds : techId ? [techId] : [];

  return (
    <Select
      disallowEmptySelection
      className="w-full"
      items={jobCategories}
      label="Filter by job category"
      placeholder="Select job category"
      selectedKeys={defaultKeys}
      selectionMode="multiple"
      onSelectionChange={(keys) => {
        onJobCategoryChange(Array.from(keys) as string[]);
      }}
    >
      {(category) => (
        <SelectItem key={category.id} value={category.id}>
          {category.job_category_name}
        </SelectItem>
      )}
    </Select>
  );
}
