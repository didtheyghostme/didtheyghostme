"use client";

import { Select, SelectItem } from "@nextui-org/react";
import useSWR from "swr";
import { useEffect } from "react";
import { toast } from "sonner";
import mixpanel from "mixpanel-browser";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";

import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { CustomButton } from "@/components/CustomButton";
import { SettingsResponse } from "@/app/api/(protected)/settings/route";
import { UpdateUserPreferenceFormValues, updateUserPreferenceSchema } from "@/lib/schema/updateUserPreferenceSchema";
import { useUpdateUserPreferences } from "@/lib/hooks/useUpdateUserPreferences";
import { updateUserIsAwareOfDefaultFilter } from "@/app/actions/updateUserIsAwareOfDefaultFilter";

export default function SettingsPage() {
  const { data, error, isLoading } = useSWR<SettingsResponse>(API.PROTECTED.getSettings, fetcher);

  const { updateUserPreferences, isUpdating } = useUpdateUserPreferences();

  const { user } = useUser();

  // console.warn("data", data);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateUserPreferenceFormValues>({
    resolver: zodResolver(updateUserPreferenceSchema),
    defaultValues: {
      default_countries: [],
      default_experience_levels: [],
      default_job_categories: [],
      insert_default_countries: [],
      insert_default_experience_levels: [],
      insert_default_job_categories: [],
    },
  });

  // Set initial values when data loads
  useEffect(() => {
    if (data) {
      reset({
        default_countries: data.default_countries,
        default_experience_levels: data.default_experience_levels,
        default_job_categories: data.default_job_categories,
        insert_default_countries: data.insert_default_countries,
        insert_default_experience_levels: data.insert_default_experience_levels,
        insert_default_job_categories: data.insert_default_job_categories,
      });
    }
  }, [data, reset]);

  const onSubmit = async (formData: UpdateUserPreferenceFormValues) => {
    try {
      await updateUserPreferences(formData);

      // Check if the user is not aware of default filter before updating the flag
      if (!user?.publicMetadata.isAwareOfDefaultFilter) {
        await updateUserIsAwareOfDefaultFilter();
        await user?.reload();
      }

      mixpanel.track("Settings Saved", formData);
      toast.success("Settings saved successfully");
    } catch (err) {
      console.error("Failed to save settings", err);
      toast.error("Failed to save settings");
      mixpanel.track("Settings Save Failed Error", formData);
    }
  };

  if (isLoading) return <LoadingContent />;
  if (error) return <ErrorMessageContent message="Failed to load settings" />;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4">
      <h1 className="text-2xl font-bold">Default Preferences Settings</h1>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Job Search Preferences Section */}
        <div className="rounded-lg border border-default-200 p-6">
          <div className="mb-6 space-y-2">
            <h2 className="text-xl font-semibold">Job Search Preferences</h2>
            <p className="text-default-500">These settings will be used as default filters when browsing jobs.</p>
          </div>

          <div className="space-y-4">
            <Controller
              control={control}
              name="default_countries"
              render={({ field }) => (
                <Select
                  errorMessage={errors.default_countries?.message}
                  isInvalid={!!errors.default_countries}
                  items={data.available_countries.map((name) => ({ name }))}
                  label="Default Countries"
                  placeholder="Select countries"
                  selectedKeys={field.value}
                  selectionMode="multiple"
                  onSelectionChange={(keys) => field.onChange(Array.from(keys))}
                >
                  {(country) => (
                    <SelectItem key={country.name} value={country.name}>
                      {country.name}
                    </SelectItem>
                  )}
                </Select>
              )}
            />

            <Controller
              control={control}
              name="default_experience_levels"
              render={({ field }) => (
                <Select
                  errorMessage={errors.default_experience_levels?.message}
                  isInvalid={!!errors.default_experience_levels}
                  items={data.all_experience_levels.map((name) => ({ name }))}
                  label="Default Experience Levels"
                  placeholder="Select experience levels"
                  selectedKeys={field.value}
                  selectionMode="multiple"
                  onSelectionChange={(keys) => field.onChange(Array.from(keys))}
                >
                  {(level) => (
                    <SelectItem key={level.name} value={level.name}>
                      {level.name}
                    </SelectItem>
                  )}
                </Select>
              )}
            />

            <Controller
              control={control}
              name="default_job_categories"
              render={({ field }) => (
                <Select
                  errorMessage={errors.default_job_categories?.message}
                  isInvalid={!!errors.default_job_categories}
                  items={data.all_job_categories.map((name) => ({ name }))}
                  label="Default Job Categories"
                  placeholder="Select job categories"
                  selectedKeys={field.value}
                  selectionMode="multiple"
                  onSelectionChange={(keys) => field.onChange(Array.from(keys))}
                >
                  {(category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  )}
                </Select>
              )}
            />
          </div>
        </div>

        {/* Job Insert Preferences Section */}
        <div className="rounded-lg border border-default-200 p-6">
          <div className="mb-6 space-y-2">
            <h2 className="text-xl font-semibold">Job Insert Preferences</h2>
            <p className="text-default-500">These settings will be used as default values when adding new jobs.</p>
          </div>

          <div className="space-y-4">
            <Controller
              control={control}
              name="insert_default_countries"
              render={({ field }) => (
                <Select
                  errorMessage={errors.insert_default_countries?.message}
                  isInvalid={!!errors.insert_default_countries}
                  items={data.all_countries.map((name) => ({ name }))}
                  label="Default Countries"
                  placeholder="Select countries"
                  selectedKeys={field.value}
                  selectionMode="multiple"
                  onSelectionChange={(keys) => field.onChange(Array.from(keys))}
                >
                  {(country) => (
                    <SelectItem key={country.name} value={country.name}>
                      {country.name}
                    </SelectItem>
                  )}
                </Select>
              )}
            />

            <Controller
              control={control}
              name="insert_default_experience_levels"
              render={({ field }) => (
                <Select
                  errorMessage={errors.insert_default_experience_levels?.message}
                  isInvalid={!!errors.insert_default_experience_levels}
                  items={data.all_experience_levels.map((name) => ({ name }))}
                  label="Default Experience Levels"
                  placeholder="Select experience levels"
                  selectedKeys={field.value}
                  selectionMode="single"
                  onSelectionChange={(keys) => field.onChange(Array.from(keys))}
                >
                  {(level) => (
                    <SelectItem key={level.name} value={level.name}>
                      {level.name}
                    </SelectItem>
                  )}
                </Select>
              )}
            />

            <Controller
              control={control}
              name="insert_default_job_categories"
              render={({ field }) => (
                <Select
                  errorMessage={errors.insert_default_job_categories?.message}
                  isInvalid={!!errors.insert_default_job_categories}
                  items={data.all_job_categories.map((name) => ({ name }))}
                  label="Default Job Categories"
                  placeholder="Select job categories"
                  selectedKeys={field.value}
                  selectionMode="single"
                  onSelectionChange={(keys) => field.onChange(Array.from(keys))}
                >
                  {(category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  )}
                </Select>
              )}
            />
          </div>
        </div>

        <CustomButton className="w-full" color="primary" isLoading={isUpdating} type="submit">
          Save Settings
        </CustomButton>
      </form>
    </div>
  );
}
