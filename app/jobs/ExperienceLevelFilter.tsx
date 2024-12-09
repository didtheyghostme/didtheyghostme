import { Select, SelectItem } from "@nextui-org/react";

type ExperienceLevelFilterProps = {
  onExperienceLevelChange: (experienceLevelNames: ExperienceLevel[]) => void;
  selectedExperienceLevelNames: ExperienceLevel[];
  experienceLevels: ExperienceLevel[];
};

export function ExperienceLevelFilter({ onExperienceLevelChange, selectedExperienceLevelNames, experienceLevels }: ExperienceLevelFilterProps) {
  return (
    <Select
      disallowEmptySelection
      className="w-full"
      items={experienceLevels.map((name) => ({ name }))}
      label="Filter by experience level"
      placeholder="Select experience level"
      selectedKeys={selectedExperienceLevelNames}
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
