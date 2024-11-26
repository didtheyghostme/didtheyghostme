import { Select, SelectItem } from "@nextui-org/react";

import { ExperienceLevelSelect } from "@/app/api/experience-level/route";
import { LoadingContent } from "@/components/LoadingContent";

type ExperienceLevelFilterProps = {
  onExperienceLevelChange: (experienceLevelId: string) => void;
  selectedExperienceLevelId: string;
  experienceLevels: ExperienceLevelSelect[];
  experienceLevelsLoading: boolean;
};

export function ExperienceLevelFilter({ onExperienceLevelChange, selectedExperienceLevelId, experienceLevels, experienceLevelsLoading }: ExperienceLevelFilterProps) {
  if (experienceLevelsLoading) return <LoadingContent />;

  const internshipId = experienceLevels.find((level) => level.experience_level === "Internship")?.id ?? "";

  const defaultKey = selectedExperienceLevelId !== "" ? selectedExperienceLevelId : internshipId;

  return (
    <Select
      disallowEmptySelection
      className="w-full"
      items={experienceLevels}
      label="Filter by experience level"
      placeholder="Select experience level"
      selectedKeys={[defaultKey]}
      selectionMode="single"
      onSelectionChange={(keys) => {
        const selectedKey = Array.from(keys)[0] as string;

        onExperienceLevelChange(selectedKey);
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
