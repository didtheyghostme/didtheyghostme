"use client";

import { useForm, Controller } from "react-hook-form";
import { Input, Select, Button, ModalHeader, ModalBody, ModalFooter, SelectItem, DatePicker } from "@nextui-org/react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDate, parseDate } from "@internationalized/date";

import { UpdateJobPostingAdminFormValues } from "@/lib/schema/updateJobPostingAdminSchema";
import { useUpdateJobPostingAdmin } from "@/lib/hooks/useUpdateJobPostingAdmin";
import { updateJobPostingAdminSchema } from "@/lib/schema/updateJobPostingAdminSchema";
import { JOB_STATUS } from "@/lib/constants/jobPostingStatus";

export function JobPostingEditForm({ jobPosting, onClose }: { jobPosting: JobPostingTable; onClose: () => void }) {
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<UpdateJobPostingAdminFormValues>({
    resolver: zodResolver(updateJobPostingAdminSchema),
    defaultValues: {
      title: jobPosting.title,
      country: jobPosting.country,
      url: jobPosting.url,
      closed_date: jobPosting.closed_date,
      job_status: jobPosting.job_status,
      job_posted_date: jobPosting.job_posted_date,
    },
  });

  const { updateJobPosting, isUpdating } = useUpdateJobPostingAdmin(jobPosting.id);

  const onSubmit = async (data: UpdateJobPostingAdminFormValues) => {
    try {
      await updateJobPosting(data, jobPosting.job_status);
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
            name="country"
            render={({ field, fieldState }) => <Input {...field} errorMessage={fieldState.error?.message} isInvalid={!!fieldState.error} label="Country" />}
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
                value={field.value ? parseDate(field.value.split("T")[0]) : undefined}
                onChange={(date: CalendarDate) => field.onChange(date.toString())}
              />
            )}
          />

          <Controller
            control={control}
            name="closed_date"
            render={({ field, fieldState }) => (
              <DatePicker
                errorMessage={fieldState.error?.message}
                isInvalid={!!fieldState.error}
                label="Closed Date"
                value={field.value ? parseDate(field.value.split("T")[0]) : undefined}
                onChange={(date: CalendarDate) => field.onChange(date.toString())}
              />
            )}
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <Button className="mr-2" color="danger" variant="light" onPress={onClose}>
          Cancel
        </Button>
        <Button color="primary" isDisabled={!isDirty} isLoading={isUpdating} type="submit">
          Save Changes
        </Button>
      </ModalFooter>
    </form>
  );
}
