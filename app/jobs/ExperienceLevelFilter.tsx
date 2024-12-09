import { Select, SelectItem } from "@nextui-org/react";

type ExperienceLevelFilterProps = {
  onExperienceLevelChange: (experienceLevelIds: ExperienceLevel[]) => void;
  selectedExperienceLevelIds: ExperienceLevel[];
  experienceLevels: ExperienceLevel[];
};

export function ExperienceLevelFilter({ onExperienceLevelChange, selectedExperienceLevelIds, experienceLevels }: ExperienceLevelFilterProps) {
  return (
    <Select
      disallowEmptySelection
      className="w-full"
      items={experienceLevels.map((name) => ({ name }))}
      label="Filter by experience level"
      placeholder="Select experience level"
      selectedKeys={selectedExperienceLevelIds}
      selectionMode="multiple"
      onSelectionChange={(keys) => {
        onExperienceLevelChange(Array.from(keys) as ExperienceLevel[]);
      }}
    >
      {(level) => (
        <SelectItem key={level.name} value={level.name}>
          {level.name}
        </SelectItem>
      )}
    </Select>
  );
}
