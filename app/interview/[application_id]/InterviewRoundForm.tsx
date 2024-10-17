import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Button, DatePicker, Tooltip } from "@nextui-org/react";
import { parseDate } from "@internationalized/date";
import { useEffect } from "react";

import { interviewRoundSchema, InterviewRoundSchema } from "@/lib/schema/addInterviewRoundSchema";

type InterviewRoundFormProps = {
  isEditing: boolean;
  initialData?: InterviewRoundSchema[];
  onSubmit: (data: InterviewRoundSchema[]) => void;
};

export function InterviewRoundForm({ isEditing, initialData, onSubmit }: InterviewRoundFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ interviewRounds: InterviewRoundSchema[] }>({
    resolver: zodResolver(z.object({ interviewRounds: z.array(interviewRoundSchema) })),
    defaultValues: {
      interviewRounds: initialData || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "interviewRounds",
  });

  const handleAddNewInterviewRoundClick = () => {
    append({ description: "", interview_date: "", response_date: null });
  };

  const onFormSubmit = handleSubmit((data) => onSubmit(data.interviewRounds));

  // Effect to reset form when editing is canceled
  useEffect(() => {
    if (!isEditing) {
      reset({ interviewRounds: initialData || [] });
    }
  }, [isEditing, initialData, reset]);

  return (
    <>
      {fields.length == 0 && <div className="mb-4 text-2xl font-semibold">There is no interviews yet</div>}

      <form className="space-y-4" onSubmit={onFormSubmit}>
        {fields.map((field, index) => (
          <div key={field.id} className="mb-4 rounded-md border p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Round {index + 1}</h4>
              {isEditing && (
                <Tooltip content="Remove this interview round">
                  <Button
                    color="danger"
                    size="sm"
                    type="button"
                    onClick={() => {
                      remove(index);
                    }}
                  >
                    Remove
                  </Button>
                </Tooltip>
              )}
            </div>
            <Controller
              control={control}
              name={`interviewRounds.${index}.description`}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  isRequired
                  className="mt-2"
                  disabled={!isEditing}
                  errorMessage={fieldState.error?.message}
                  isInvalid={!!fieldState.error}
                  label="Description"
                  placeholder="Enter interview round description"
                />
              )}
            />
            <Controller
              control={control}
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
              control={control}
              name={`interviewRounds.${index}.response_date`}
              render={({ field }) => (
                <DatePicker
                  className="mt-2"
                  isDisabled={!isEditing}
                  label="Response Date"
                  value={field.value ? parseDate(field.value) : null}
                  onChange={(date) => field.onChange(date ? date.toString() : null)}
                />
              )}
            />
          </div>
        ))}

        {isEditing && (
          <div className="flex items-center space-x-4">
            <Button type="button" onClick={handleAddNewInterviewRoundClick}>
              Add New Round
            </Button>
            <Button color="primary" type="submit">
              Save
            </Button>
          </div>
        )}
      </form>
    </>
  );
}
