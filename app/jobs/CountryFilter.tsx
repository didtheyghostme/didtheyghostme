"use client";

import { Select, SelectItem } from "@nextui-org/react";

import { AvailableCountry } from "@/app/api/country/available/route";
import { LoadingContent } from "@/components/LoadingContent";

type CountryFilterProps = {
  onCountriesChange: (countries: string[]) => void;
  selectedCountries: string[];
  availableCountries: AvailableCountry[];
  countriesLoading: boolean;
};

export function CountryFilter({ onCountriesChange, selectedCountries, availableCountries, countriesLoading }: CountryFilterProps) {
  if (countriesLoading) return <LoadingContent />;

  const singaporeId = availableCountries.find((country) => country.country_name === "Singapore")?.id;

  const hasValidSelection = selectedCountries.some((id) => id.trim().length > 0); // to handle [""] as availableCountries.length > 0 will be true

  const defaultKeys = hasValidSelection ? selectedCountries : singaporeId ? [singaporeId] : [];

  return (
    <Select
      disallowEmptySelection
      isMultiline
      className="w-full"
      items={availableCountries}
      label="Filter by countries"
      placeholder="Select countries"
      selectedKeys={defaultKeys}
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
