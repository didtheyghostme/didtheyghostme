"use client";

import { useForm, Controller } from "react-hook-form";
import { Input, Select, ModalHeader, ModalBody, ModalFooter, SelectItem, DatePicker } from "@nextui-org/react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDate, parseDate, getLocalTimeZone, today } from "@internationalized/date";

import { UpdateJobPostingAdminFormValues } from "@/lib/schema/updateJobPostingAdminSchema";
import { useUpdateJobPostingAdmin } from "@/lib/hooks/useUpdateJobPostingAdmin";
import { updateJobPostingAdminSchema } from "@/lib/schema/updateJobPostingAdminSchema";
import { JOB_STATUS } from "@/lib/constants/jobPostingStatus";
import { CustomButton } from "@/components/CustomButton";
import { AllJobPostingWithCompany } from "@/app/api/(admin)/admin/job/route";
import { ExperienceLevelSelect } from "@/app/api/experience-level/route";

export function JobPostingEditForm({
  jobPosting,
  countries,
  experienceLevels,
  onClose,
}: {
  jobPosting: AllJobPostingWithCompany;
  countries: CountryTable[];
  experienceLevels: ExperienceLevelSelect[];
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
      countries: jobPosting.job_posting_country.map((jpc) => jpc.country.id),
      closed_date: jobPosting.closed_date,
      job_status: jobPosting.job_status,
      job_posted_date: jobPosting.job_posted_date,
      experience_level_id: jobPosting.job_posting_experience_level.map((jpel) => jpel.experience_level.id),
    },
  });

  // console.warn("experience levels", experienceLevels, "current", jobPosting.job_posting_experience_level);

  const { updateJobPosting, isUpdating } = useUpdateJobPostingAdmin(jobPosting.id);

  const onSubmit = async (data: UpdateJobPostingAdminFormValues) => {
    try {
      await updateJobPosting(data);
      // console.warn("data", data);
      toast.success("Job posting updated successfully");
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
          <Controller control={control} name="title" render={({ field, fieldState }) => <Input {...field} errorMessage={fieldState.error?.message} isInvalid={!!fieldState.error} label="Title" />} />

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
                onSelectionChange={(keys) => field.onChange(Array.from(keys))}
              >
                {(country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.country_name}
                  </SelectItem>
                )}
              </Select>
            )}
          />

          <Controller
            control={control}
            name="experience_level_id"
            render={({ field, fieldState }) => (
              <Select
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
                items={experienceLevels}
                label="Experience Level"
                selectedKeys={field.value}
                selectionMode="single"
                onSelectionChange={(keys) => field.onChange(Array.from(keys))}
              >
                {(level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.experience_level}
                  </SelectItem>
                )}
              </Select>
            )}
          />

          <Controller
            control={control}
            name="url"
            render={({ field, fieldState }) => <Input {...field} errorMessage={fieldState.error?.message} isInvalid={!!fieldState.error} label="URL" type="url" value={field.value ?? ""} />}
          />

          <Controller
            control={control}
            name="job_status"
            render={({ field, fieldState }) => (
              <Select errorMessage={fieldState.error?.message} isInvalid={!!fieldState.error} label="Status" selectedKeys={[field.value]} onChange={field.onChange}>
                {Object.values(JOB_STATUS).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
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
                onChange={(date: CalendarDate) => field.onChange(date.toString())}
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
                onChange={(date: CalendarDate) => field.onChange(date.toString())}
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
