import { Select, SelectItem } from "@nextui-org/react";

import { ExperienceLevelSelect } from "@/app/api/experience-level/route";
import { LoadingContent } from "@/components/LoadingContent";

type ExperienceLevelFilterProps = {
  onExperienceLevelChange: (experienceLevelIds: string[]) => void;
  selectedExperienceLevelIds: string[];
  experienceLevels: ExperienceLevelSelect[];
  experienceLevelsLoading: boolean;
};

export function ExperienceLevelFilter({ onExperienceLevelChange, selectedExperienceLevelIds, experienceLevels, experienceLevelsLoading }: ExperienceLevelFilterProps) {
  if (experienceLevelsLoading) return <LoadingContent />;

  const internshipId = experienceLevels.find((level) => level.experience_level === "Internship")?.id;

  const hasValidSelection = selectedExperienceLevelIds.some((id) => id.trim().length > 0); // to handle [""] as experienceLevels.length > 0 will be true

  const defaultKeys = hasValidSelection ? selectedExperienceLevelIds : internshipId ? [internshipId] : [];

  return (
    <Select
      disallowEmptySelection
      className="w-full"
      items={experienceLevels}
      label="Filter by experience level"
      placeholder="Select experience level"
      selectedKeys={defaultKeys}
      selectionMode="multiple"
      onSelectionChange={(keys) => {
        onExperienceLevelChange(Array.from(keys) as string[]);
      }}
    >
      {(level) => (
        <SelectItem key={level.id} value={level.id}>
          {level.experience_level}
        </SelectItem>
      )}
    </Select>
  );
}
