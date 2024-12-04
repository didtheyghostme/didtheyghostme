"use client";

import { Select, SelectItem } from "@nextui-org/react";
import useSWR from "swr";
import { useState } from "react";
import { toast } from "sonner";
import mixpanel from "mixpanel-browser";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { CustomButton } from "@/components/CustomButton";
import { ExperienceLevelSelect } from "@/app/api/experience-level/route";
import { JobCategorySelect } from "@/app/api/job-category/route";

export default function SettingsPage() {
  const { data: countries = [], error: countriesError, isLoading: countriesLoading } = useSWR<CountryTable[]>(API.COUNTRY.getAll, fetcher);

  const { data: experienceLevels = [], error: experienceLevelsError, isLoading: experienceLevelsLoading } = useSWR<ExperienceLevelSelect[]>(API.EXPERIENCE_LEVEL.getAll, fetcher);

  const { data: jobCategories = [], error: jobCategoriesError, isLoading: jobCategoriesLoading } = useSWR<JobCategorySelect[]>(API.JOB_CATEGORY.getAll, fetcher);

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState<string>("");
  const [selectedJobCategory, setSelectedJobCategory] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  if (countriesLoading || experienceLevelsLoading || jobCategoriesLoading) return <LoadingContent />;
  if (countriesError || experienceLevelsError || jobCategoriesError) {
    return <ErrorMessageContent message="Failed to load settings" />;
  }

  const handleSaveSettings = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      // TODO: Implement API endpoint to save user preferences

      //   mixpanel.track("Settings Saved", {
      //     default_country: selectedCountry,
      //     default_experience_level: selectedExperienceLevel,
      //     default_job_category: selectedJobCategory,
      //   });

      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Default Preferences</h2>
          <p className="text-default-500">These settings will be used as default filters when browsing jobs.</p>
        </div>

        <Select
          label="Default Country"
          placeholder="Select a country"
          selectedKeys={selectedCountry ? [selectedCountry] : []}
          selectionMode="single"
          onSelectionChange={(keys) => setSelectedCountry(Array.from(keys)[0] as string)}
        >
          {countries.map((country) => (
            <SelectItem key={country.id} value={country.id}>
              {country.country_name}
            </SelectItem>
          ))}
        </Select>

        <Select
          label="Default Experience Level"
          placeholder="Select an experience level"
          selectedKeys={selectedExperienceLevel ? [selectedExperienceLevel] : []}
          selectionMode="single"
          onSelectionChange={(keys) => setSelectedExperienceLevel(Array.from(keys)[0] as string)}
        >
          {experienceLevels.map((level) => (
            <SelectItem key={level.id} value={level.id}>
              {level.experience_level}
            </SelectItem>
          ))}
        </Select>

        <Select
          label="Default Job Category"
          placeholder="Select a job category"
          selectedKeys={selectedJobCategory ? [selectedJobCategory] : []}
          selectionMode="single"
          onSelectionChange={(keys) => setSelectedJobCategory(Array.from(keys)[0] as string)}
        >
          {jobCategories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.job_category_name}
            </SelectItem>
          ))}
        </Select>

        <CustomButton className="w-full" color="primary" isLoading={isSaving} onPress={handleSaveSettings}>
          Save Settings
        </CustomButton>
      </div>
    </div>
  );
}
