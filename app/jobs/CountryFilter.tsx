"use client";

import { Select, SelectItem } from "@nextui-org/react";

import { AvailableCountry } from "@/app/api/country/available/route";

type CountryFilterProps = {
  onCountriesChange: (countries: string[]) => void;
  selectedCountries: string[];
  availableCountries: AvailableCountry[];
  isLoading: boolean;
};

export function CountryFilter({ onCountriesChange, selectedCountries, availableCountries, isLoading }: CountryFilterProps) {
  return (
    <Select
      className="max-w-xs"
      isLoading={isLoading}
      items={availableCountries}
      label="Filter by countries"
      placeholder="Select countries"
      selectedKeys={selectedCountries}
      selectionMode="multiple"
      onSelectionChange={(keys) => onCountriesChange(Array.from(keys) as string[])}
    >
      {(country) => (
        <SelectItem key={country.id} value={country.id}>
          {country.country_name}
        </SelectItem>
      )}
    </Select>
  );
}
