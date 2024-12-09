"use client";

import { Select, SelectItem } from "@nextui-org/react";

type CountryFilterProps = {
  onCountriesChange: (countries: string[]) => void;
  selectedCountries: string[];
  availableCountries: string[];
};

export function CountryFilter({ onCountriesChange, selectedCountries, availableCountries }: CountryFilterProps) {
  return (
    <Select
      disallowEmptySelection
      isMultiline
      className="w-full"
      items={availableCountries.map((name) => ({ name }))}
      label="Filter by countries"
      placeholder="Select countries"
      selectedKeys={selectedCountries}
      selectionMode="multiple"
      onSelectionChange={(keys) => onCountriesChange(Array.from(keys) as string[])}
    >
      {(country) => (
        <SelectItem key={country.name} value={country.name}>
          {country.name}
        </SelectItem>
      )}
    </Select>
  );
}
