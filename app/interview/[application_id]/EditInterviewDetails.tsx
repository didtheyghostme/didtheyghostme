import { FormProvider, useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardBody, CardHeader, Divider, DatePicker, Input, Button, Tooltip, Chip } from "@nextui-org/react";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import { useState } from "react";

import { INTERVIEW_FORM_ID, InterviewExperienceFormValues, UpdateInterviewExperienceSchema } from "./page";
import { InterviewTagsModal } from "./InterviewTagsModal";

type EditInterviewDetailsProps = {
  applicationDetails: ProcessedApplication;
  interviewRounds: InterviewExperienceTable[];
  onSave: (data: InterviewExperienceFormValues) => Promise<void>;
};

export function EditInterviewDetails({ applicationDetails, interviewRounds, onSave }: EditInterviewDetailsProps) {
  const [openModalIndex, setOpenModalIndex] = useState<number | null>(null);

  const methods = useForm<InterviewExperienceFormValues>({
    resolver: zodResolver(UpdateInterviewExperienceSchema),
    defaultValues: {
      interviewRounds: interviewRounds,
      first_response_date: applicationDetails.first_response_date || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "interviewRounds",
  });

  const firstResponseDate = useWatch({
    control: methods.control,
    name: "first_response_date",
  });

  const handleAddNewInterviewRoundClick = () => {
    append({ description: "", interview_date: "", response_date: null, interview_tags: [] });
  };

  return (
    <FormProvider {...methods}>
      <form id={INTERVIEW_FORM_ID} onSubmit={methods.handleSubmit(onSave)}>
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
            </div>
          </CardBody>
        </Card>

        {firstResponseDate && (
          <>
            <div className="my-4 flex justify-end">
              <Button type="button" onClick={handleAddNewInterviewRoundClick}>
                Add New Round
              </Button>
            </div>

            {fields.length === 0 && <div className="mb-4 text-2xl font-semibold">There are no interviews yet</div>}

            {fields.map((field, index) => (
              <div key={field.id} className="mb-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Round {index + 1}</h4>
                  <Tooltip content="Remove this interview round">
                    <Button color="danger" size="sm" type="button" onClick={() => remove(index)}>
                      Remove
                    </Button>
                  </Tooltip>
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
                      value={field.value ? parseDate(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.toString() : null)}
                    />
                  )}
                />
                <Controller
                  control={methods.control}
                  name={`interviewRounds.${index}.response_date`}
                  render={({ field }) => (
                    <DatePicker className="mt-2" label="Response Date" value={field.value ? parseDate(field.value) : null} onChange={(date) => field.onChange(date ? date.toString() : null)} />
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
            ))}
          </>
        )}

        {!firstResponseDate && <div className="mb-4 text-2xl font-semibold">Please set the first response date before you can add interview rounds</div>}
      </form>
    </FormProvider>
  );
}
