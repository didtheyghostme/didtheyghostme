import { FormProvider, useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardBody, CardHeader, Divider, DatePicker, Button, Chip, Select, SelectItem, Textarea, Input } from "@nextui-org/react";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import { useState } from "react";
import { toast } from "sonner";
import mixpanel from "mixpanel-browser";

import { InterviewTagsModal, utilSortInterviewTags } from "./InterviewTagsModal";

import { INTERVIEW_FORM_ID, InterviewExperienceFormValues, UpdateInterviewExperienceFormSchema } from "@/lib/schema/updateInterviewRoundSchema";
import { InterviewExperienceCardData, LEETCODE_DIFFICULTY } from "@/lib/sharedTypes";
import { APPLICATION_STATUS } from "@/lib/constants/applicationStatus";
import { GetApplicationByIdResponse } from "@/app/api/application/[application_id]/route";
import { ImageWithFallback } from "@/components/ImageWithFallback";

type EditInterviewDetailsProps = {
  applicationDetails: GetApplicationByIdResponse;
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
    const currentInterviewRounds = methods.getValues("interviewRounds");

    if (currentInterviewRounds.length === 0) return true;
    const lastRound = currentInterviewRounds[currentInterviewRounds.length - 1];

    return lastRound && lastRound.response_date !== null;
  };

  const handleAddNewInterviewRoundClick = async () => {
    const isFormValid = await methods.trigger();

    mixpanel.track("Interview Experience Edit", {
      action: "add_round_attempted",
      application_id: applicationDetails.id,
      current_rounds: fields.length,
      is_form_valid: isFormValid,
      error: methods.formState.errors,
      can_add_round: canAddNewRound(),
    });

    if (!isFormValid) {
      toast.error("Please fix the errors in the form before adding a new one.");
    } else {
      if (canAddNewRound()) {
        append({
          description: "",
          interview_date: today(getLocalTimeZone()).toString(),
          response_date: null,
          interview_tags: [],
          leetcode_questions: [],
        });
      } else {
        const latestRoundNumber = fields.length;

        toast.error(`Please fill the response date for the latest interview Round ${latestRoundNumber} before adding a new round.`);
      }
    }
  };

  const handleFormSubmit = methods.handleSubmit(onSave, () => {
    // On error callback
    toast.error("Please fix the errors in the form before saving.");
    mixpanel.track("Interview Experience Edit", {
      action: "form_validation_error",
      application_id: applicationDetails.id,
      error: methods.formState.errors,
    });
  });

  const trackStatusChange = (value: string) => {
    mixpanel.track("Interview Experience Edit", {
      action: "status_changed",
      application_id: applicationDetails.id,
      previous_status: methods.getValues("status"),
      new_status: value,
    });
  };

  const trackRoundRemoval = (index: number) => {
    mixpanel.track("Interview Experience Edit", {
      action: "round_removed",
      application_id: applicationDetails.id,
      round_number: index + 1,
      total_rounds: fields.length,
    });
    remove(index);
  };

  const trackTagsChange = (index: number, tags: string[]) => {
    mixpanel.track("Interview Experience Edit", {
      action: "tags_updated",
      application_id: applicationDetails.id,
      round_number: index + 1,
      tags_count: tags.length,
      tags: tags,
    });
  };

  const trackLeetcodeQuestionAdd = (roundIndex: number) => {
    mixpanel.track("Interview Experience Edit", {
      action: "leetcode_question_added",
      application_id: applicationDetails.id,
      round_number: roundIndex + 1,
    });
  };

  const trackLeetcodeQuestionRemove = (roundIndex: number, questionIndex: number) => {
    mixpanel.track("Interview Experience Edit", {
      action: "leetcode_question_removed",
      application_id: applicationDetails.id,
      round_number: roundIndex + 1,
      question_index: questionIndex,
    });
  };

  return (
    <FormProvider {...methods}>
      <form id={INTERVIEW_FORM_ID} onSubmit={handleFormSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 flex-shrink-0">
                <ImageWithFallback
                  alt={applicationDetails.job_posting.company.company_name}
                  companyName={applicationDetails.job_posting.company.company_name}
                  src={applicationDetails.job_posting.company.logo_url}
                />
              </div>
              <div>
                <h2 className="text-lg">{applicationDetails.job_posting.title}</h2>
                <p className="text-default-500">{applicationDetails.job_posting.company.company_name}</p>
              </div>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="flex w-full flex-wrap gap-4 md:flex-nowrap">
              <Controller
                control={methods.control}
                name="status"
                render={({ field }) => (
                  <Select
                    label="Application Status"
                    placeholder="Select application status"
                    selectedKeys={[field.value]}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      trackStatusChange(e.target.value);
                    }}
                  >
                    {Object.values(APPLICATION_STATUS).map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />

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
                    <Button
                      color="danger"
                      size="sm"
                      type="button"
                      onClick={() => {
                        trackRoundRemoval(index);
                        remove(index);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <Controller
                    control={methods.control}
                    name={`interviewRounds.${index}.description`}
                    render={({ field, fieldState }) => (
                      <Textarea
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
                            {utilSortInterviewTags(field.value).map((tag) => (
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
                            trackTagsChange(index, tags);
                          }}
                        />
                      </>
                    )}
                  />

                  {/* leetcode questions */}

                  <Controller
                    control={methods.control}
                    name={`interviewRounds.${index}.leetcode_questions`}
                    render={({ field }) => (
                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <p className="text-md font-semibold">LeetCode Questions</p>
                          <Button
                            size="sm"
                            onClick={() => {
                              trackLeetcodeQuestionAdd(index);
                              field.onChange([
                                ...(field.value || []),
                                {
                                  question_number: 1,
                                  difficulty: LEETCODE_DIFFICULTY.Medium,
                                },
                              ]);
                            }}
                          >
                            Add LeetCode Question
                          </Button>
                        </div>

                        {field.value &&
                          field.value.map((question, qIndex) => (
                            <div key={qIndex} className="mt-2 flex items-center gap-4">
                              <Input
                                isRequired
                                errorMessage={methods.formState.errors?.interviewRounds?.[index]?.leetcode_questions?.[qIndex]?.question_number?.message}
                                isInvalid={!!methods.formState.errors?.interviewRounds?.[index]?.leetcode_questions?.[qIndex]?.question_number}
                                label="Question Number"
                                placeholder="Enter LeetCode question number"
                                type="number"
                                value={question.question_number > 0 ? question.question_number.toString() : ""} // Show empty string for invalid values
                                onChange={(e) => {
                                  trackLeetcodeQuestionRemove(index, qIndex);

                                  const newQuestions = [...(field.value || [])];
                                  const value = parseInt(e.target.value);

                                  newQuestions[qIndex] = {
                                    ...newQuestions[qIndex],
                                    question_number: value,
                                  };
                                  field.onChange(newQuestions);
                                }}
                                onKeyDown={(e) => {
                                  // Prevent minus sign and decimal point
                                  if (e.key === "-" || e.key === ".") {
                                    e.preventDefault();
                                  }
                                }}
                              />
                              <Select
                                label="Difficulty"
                                selectedKeys={[question.difficulty]}
                                onChange={(e) => {
                                  const newQuestions = [...(field.value || [])];

                                  newQuestions[qIndex] = {
                                    ...newQuestions[qIndex],
                                    difficulty: e.target.value as LeetcodeDifficulty,
                                  };
                                  field.onChange(newQuestions);
                                }}
                              >
                                {Object.values(LEETCODE_DIFFICULTY).map((difficulty) => (
                                  <SelectItem key={difficulty}>{difficulty}</SelectItem>
                                ))}
                              </Select>
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => {
                                  const newQuestions = field.value?.filter((_, i) => i !== qIndex);

                                  field.onChange(newQuestions?.length ? newQuestions : null);
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                      </div>
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
