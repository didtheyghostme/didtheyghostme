import { Select, SelectItem } from "@nextui-org/react";

type JobCategoryFilterProps = {
  onJobCategoryChange: (categoryNames: JobCategoryName[]) => void;
  selectedJobCategoryNames: JobCategoryName[];
  jobCategories: JobCategoryName[];
};

export function JobCategoryFilter({ onJobCategoryChange, selectedJobCategoryNames, jobCategories }: JobCategoryFilterProps) {
  return (
    <Select
      disallowEmptySelection
      className="w-full"
      items={jobCategories.map((name) => ({ name }))}
      label="Filter by job category"
      placeholder="Select job category"
      selectedKeys={selectedJobCategoryNames}
      selectionMode="multiple"
      onSelectionChange={(keys) => {
        onJobCategoryChange(Array.from(keys) as JobCategoryName[]);
      }}
    >
      {(category) => (
        <SelectItem key={category.name} value={category.name}>
          {category.name}
        </SelectItem>
      )}
    </Select>
  );
}
