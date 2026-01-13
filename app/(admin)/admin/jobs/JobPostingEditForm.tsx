"use client";

import { useForm, Controller } from "react-hook-form";
import { Input, Select, ModalHeader, ModalBody, ModalFooter, SelectItem, DatePicker, cn } from "@heroui/react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseDate, getLocalTimeZone, today } from "@internationalized/date";

import { UpdateJobPostingAdminFormValues } from "@/lib/schema/updateJobPostingAdminSchema";
import { useUpdateJobPostingAdmin } from "@/lib/hooks/useUpdateJobPostingAdmin";
import { updateJobPostingAdminSchema } from "@/lib/schema/updateJobPostingAdminSchema";
import { JOB_STATUS } from "@/lib/constants/jobPostingStatus";
import { CustomButton } from "@/components/CustomButton";
import { AllJobPostingWithCompany } from "@/app/api/(admin)/admin/job/route";
import { ExperienceLevelSelect } from "@/app/api/experience-level/route";
import { JobCategorySelect } from "@/app/api/job-category/route";

const DIRTY_INPUT_CLASS = "bg-orange-50 border-l-4 border-orange-400 dark:bg-orange-900/20";

export function JobPostingEditForm({
  jobPosting,
  countries,
  experienceLevels,
  jobCategories,
  onClose,
}: {
  jobPosting: AllJobPostingWithCompany;
  countries: CountryTable[];
  experienceLevels: ExperienceLevelSelect[];
  jobCategories: JobCategorySelect[];
  onClose: () => void;
}) {
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<UpdateJobPostingAdminFormValues>({
    resolver: zodResolver(updateJobPostingAdminSchema),
    defaultValues: {
      title: jobPosting.title,
      url: jobPosting.url,
      job_url_linkedin: jobPosting.job_url_linkedin,
      countries: jobPosting.job_posting_country.map((jpc) => jpc.country.id),
      closed_date: jobPosting.closed_date,
      job_status: jobPosting.job_status,
      job_posted_date: jobPosting.job_posted_date,
      experience_level_ids: jobPosting.job_posting_experience_level.map((jpel) => jpel.experience_level.id),
      job_category_ids: jobPosting.job_posting_job_category.map((jpc) => jpc.job_category.id),
    },
  });

  // console.warn("experience levels", experienceLevels, "current", jobPosting.job_posting_experience_level);

  const { updateJobPosting, isUpdating } = useUpdateJobPostingAdmin(jobPosting.id);

  const onSubmit = async (data: UpdateJobPostingAdminFormValues) => {
    try {
      const result = await updateJobPosting(data);

      // console.warn("data", data);
      toast.success("Job posting updated successfully");

      if (result.readmeSync?.ok === false) {
        toast.error(`README sync failed: ${result.readmeSync.error}`);
      }
      if (result.readmeSync?.ok === true && result.readmeSync.didChange) {
        toast.success(`README synced (${result.readmeSync.exportedCount} jobs)`);
      }

      onClose();
    } catch (error) {
      toast.error("Failed to update job posting");
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <ModalHeader>
        <h2 className="text-lg font-semibold">Edit Job Posting</h2>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
                label="Title"
                className={cn({
                  [DIRTY_INPUT_CLASS]: fieldState.isDirty,
                })}
              />
            )}
          />

          <Controller
            control={control}
            name="countries"
            render={({ field, fieldState }) => (
              <Select
                disallowEmptySelection
                isMultiline
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
                items={countries}
                label="Countries"
                placeholder="Select countries"
                selectedKeys={field.value}
                selectionMode="multiple"
                classNames={{
                  base: fieldState.isDirty ? DIRTY_INPUT_CLASS : "",
                }}
                onSelectionChange={(keys) => field.onChange(Array.from(keys))}
              >
                {(country) => <SelectItem key={country.id}>{country.country_name}</SelectItem>}
              </Select>
            )}
          />

          <Controller
            control={control}
            name="experience_level_ids"
            render={({ field, fieldState }) => (
              <Select
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
                items={experienceLevels}
                label="Experience Level"
                selectedKeys={field.value}
                selectionMode="single"
                className={cn({
                  [DIRTY_INPUT_CLASS]: fieldState.isDirty,
                })}
                onSelectionChange={(keys) => field.onChange(Array.from(keys))}
              >
                {(level) => <SelectItem key={level.id}>{level.experience_level}</SelectItem>}
              </Select>
            )}
          />

          <Controller
            control={control}
            name="job_category_ids"
            render={({ field, fieldState }) => (
              <Select
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
                items={jobCategories}
                label="Job Category"
                selectedKeys={field.value}
                selectionMode="single"
                className={cn({
                  [DIRTY_INPUT_CLASS]: fieldState.isDirty,
                })}
                onSelectionChange={(keys) => field.onChange(Array.from(keys))}
              >
                {(category) => <SelectItem key={category.id}>{category.job_category_name}</SelectItem>}
              </Select>
            )}
          />

          <Controller
            control={control}
            name="url"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
                label="URL"
                type="url"
                value={field.value ?? ""}
                className={cn({
                  [DIRTY_INPUT_CLASS]: fieldState.isDirty,
                })}
              />
            )}
          />

          <Controller
            control={control}
            name="job_url_linkedin"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
                label="LinkedIn URL"
                type="url"
                value={field.value ?? ""}
                className={cn({
                  [DIRTY_INPUT_CLASS]: fieldState.isDirty,
                })}
              />
            )}
          />

          <Controller
            control={control}
            name="job_status"
            render={({ field, fieldState }) => (
              <Select
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
                label="Status"
                selectedKeys={[field.value]}
                className={cn({
                  [DIRTY_INPUT_CLASS]: fieldState.isDirty,
                })}
                onChange={field.onChange}
              >
                {Object.values(JOB_STATUS).map((status) => (
                  <SelectItem key={status}>{status}</SelectItem>
                ))}
              </Select>
            )}
          />

          <Controller
            control={control}
            name="job_posted_date"
            render={({ field, fieldState }) => (
              <DatePicker
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
                label="Posted Date"
                maxValue={today(getLocalTimeZone())}
                value={field.value ? parseDate(field.value) : null}
                className={cn({
                  [DIRTY_INPUT_CLASS]: fieldState.isDirty,
                })}
                onChange={(date) => field.onChange(date ? date.toString() : null)}
              />
            )}
          />

          <Controller
            control={control}
            name="closed_date"
            render={({ field, fieldState }) => (
              <DatePicker
                description="Leave blank if the job is still open"
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
                label="Closed Date"
                value={field.value ? parseDate(field.value) : null}
                className={cn({
                  [DIRTY_INPUT_CLASS]: fieldState.isDirty,
                })}
                onChange={(date) => field.onChange(date ? date.toString() : null)}
              />
            )}
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <CustomButton className="mr-2" color="danger" variant="light" onPress={onClose}>
          Cancel
        </CustomButton>
        <CustomButton color="primary" isDisabled={!isDirty} isLoading={isUpdating} type="submit">
          Save Changes
        </CustomButton>
      </ModalFooter>
    </form>
  );
}
