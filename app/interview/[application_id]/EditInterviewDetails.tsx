import { FormProvider, useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardBody, CardHeader, Divider, DatePicker, Input, Button, Chip, Select, SelectItem } from "@nextui-org/react";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import { useState } from "react";
import { toast } from "sonner";

import { InterviewTagsModal } from "./InterviewTagsModal";

import { INTERVIEW_FORM_ID, InterviewExperienceFormValues, UpdateInterviewExperienceFormSchema } from "@/lib/schema/addInterviewRoundSchema";
import { InterviewExperienceCardData } from "@/lib/sharedTypes";
import { APPLICATION_STATUS } from "@/lib/constants/applicationStatus";

type EditInterviewDetailsProps = {
  applicationDetails: ProcessedApplication;
  interviewRounds: InterviewExperienceCardData[];
  onSave: (data: InterviewExperienceFormValues) => Promise<void>;
};

export function EditInterviewDetails({ applicationDetails, interviewRounds, onSave }: EditInterviewDetailsProps) {
  const [openModalIndex, setOpenModalIndex] = useState<number | null>(null);

  const methods = useForm<InterviewExperienceFormValues>({
    resolver: zodResolver(UpdateInterviewExperienceFormSchema),
    defaultValues: {
      applied_date: applicationDetails.applied_date,
      first_response_date: applicationDetails.first_response_date ?? null,
      status: applicationDetails.status,
      interviewRounds: interviewRounds,
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "interviewRounds",
  });

  const hasFirstResponseDate = useWatch({
    control: methods.control,
    name: "first_response_date",
  });

  const canAddNewRound = () => {
    if (fields.length === 0) return true;
    const lastRound = fields[fields.length - 1];

    return lastRound && lastRound.response_date;
  };

  const handleAddNewInterviewRoundClick = async () => {
    if (canAddNewRound()) {
      append({
        description: "",
        interview_date: today(getLocalTimeZone()).toString(),
        response_date: null,
        interview_tags: [],
      });
    } else {
      const isFormValid = await methods.trigger();

      if (!isFormValid) {
        toast.error("Please fix the errors in the form before adding a new one.");
      } else {
        const latestRoundNumber = fields.length;

        toast.error(`Please fill the response date for the latest interview Round ${latestRoundNumber} before adding a new round.`);
      }
    }
  };

  const handleFormSubmit = methods.handleSubmit(onSave, () => {
    // On error callback
    toast.error("Please fix the errors in the form before saving.");
  });

  return (
    <FormProvider {...methods}>
      <form id={INTERVIEW_FORM_ID} onSubmit={handleFormSubmit}>
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">title</h2>
            <p className="text-default-500">company_name</p>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="flex w-1/2 flex-wrap gap-4 md:flex-nowrap">
              <Controller
                control={methods.control}
                name="applied_date"
                render={({ field, fieldState }) => (
                  <DatePicker
                    isRequired
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Applied Date"
                    maxValue={today(getLocalTimeZone())}
                    value={field.value ? parseDate(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.toString() : null)}
                  />
                )}
              />
              <Controller
                control={methods.control}
                name="first_response_date"
                render={({ field, fieldState }) => (
                  <DatePicker
                    isRequired
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="First Response Date"
                    maxValue={today(getLocalTimeZone())}
                    value={field.value ? parseDate(field.value) : null}
                    onChange={(date) => field.onChange(date ? date.toString() : null)}
                  />
                )}
              />

              <Controller
                control={methods.control}
                name="status"
                render={({ field }) => (
                  <Select label="Application Status" placeholder="Select application status" selectedKeys={[field.value]} onChange={(e) => field.onChange(e.target.value)}>
                    {Object.entries(APPLICATION_STATUS).map(([_, value]) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
            </div>
          </CardBody>
        </Card>

        {hasFirstResponseDate && (
          <>
            <div className="my-4 flex justify-end">
              <Button type="button" onClick={handleAddNewInterviewRoundClick}>
                Add New Round
              </Button>
            </div>

            {fields.length === 0 && <div className="mb-4 text-2xl font-semibold">There are no interviews yet. Add a new round to start.</div>}

            {fields.map((field, index) => {
              const isLastRound = index === fields.length - 1;

              return (
                <div key={field.id} className="mb-4 rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">Round {index + 1}</p>
                    <Button color="danger" size="sm" type="button" onClick={() => remove(index)}>
                      Remove
                    </Button>
                  </div>
                  <Controller
                    control={methods.control}
                    name={`interviewRounds.${index}.description`}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        isRequired
                        className="mt-2"
                        errorMessage={fieldState.error?.message}
                        isInvalid={!!fieldState.error}
                        label="Description"
                        placeholder="Enter interview round description"
                      />
                    )}
                  />
                  <Controller
                    control={methods.control}
                    name={`interviewRounds.${index}.interview_date`}
                    render={({ field, fieldState }) => (
                      <DatePicker
                        isRequired
                        className="mt-2"
                        errorMessage={fieldState.error?.message}
                        isInvalid={!!fieldState.error}
                        label="Interview Date"
                        maxValue={today(getLocalTimeZone())}
                        value={field.value ? parseDate(field.value) : null}
                        onChange={(date) => field.onChange(date ? date.toString() : null)}
                      />
                    )}
                  />
                  <Controller
                    control={methods.control}
                    name={`interviewRounds.${index}.response_date`}
                    render={({ field, fieldState }) => (
                      <DatePicker
                        className="mt-2"
                        errorMessage={fieldState.error?.message}
                        isInvalid={!!fieldState.error}
                        isRequired={!isLastRound}
                        label="Response Date"
                        maxValue={today(getLocalTimeZone())}
                        value={field.value ? parseDate(field.value) : null}
                        onChange={(date) => field.onChange(date ? date.toString() : null)}
                      />
                    )}
                  />

                  <Controller
                    control={methods.control}
                    name={`interviewRounds.${index}.interview_tags`}
                    render={({ field }) => (
                      <>
                        <Button className="mt-2" color="secondary" variant="bordered" onPress={() => setOpenModalIndex(index)}>
                          Select Interview Tags
                        </Button>
                        {field.value && field.value.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {field.value.map((tag) => (
                              <Chip key={tag}>{tag}</Chip>
                            ))}
                          </div>
                        )}
                        <InterviewTagsModal
                          isOpen={openModalIndex === index}
                          selectedTags={field.value || []}
                          onClose={() => setOpenModalIndex(null)}
                          onTagsChange={(tags) => {
                            field.onChange(tags);
                            setOpenModalIndex(null);
                          }}
                        />
                      </>
                    )}
                  />
                </div>
              );
            })}
          </>
        )}

        {!hasFirstResponseDate && <div className="mb-4 text-2xl font-semibold">Please set the first response date before you can add interview rounds</div>}
      </form>
    </FormProvider>
  );
}
