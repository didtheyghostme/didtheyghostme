"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Card, CardBody, Spacer, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Avatar } from "@nextui-org/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import mixpanel from "mixpanel-browser";

import { useCreateComment } from "@/lib/hooks/useCreateComment";
import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { addQuestionSchema, AddQuestionFormValues } from "@/lib/schema/addQuestionSchema";
import { QuestionWithReplyCountResponse } from "@/app/api/comment/route";
import { formatHowLongAgo } from "@/lib/formatDateUtils";
import { ERROR_MESSAGES, isRateLimitError } from "@/lib/errorHandling";
import { RateLimitErrorMessage } from "@/components/RateLimitErrorMessage";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { DataNotFoundMessage } from "@/components/DataNotFoundMessage";
import { CustomButton } from "@/components/CustomButton";

type QuestionContentProps = {
  job_posting_id: string;
};

export function QuestionContent({ job_posting_id }: QuestionContentProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { control, handleSubmit, reset } = useForm<AddQuestionFormValues>({
    resolver: zodResolver(addQuestionSchema),
    defaultValues: {
      content: "",
    },
  });

  const { data: questions = [], error, isLoading } = useSWR<QuestionWithReplyCountResponse[]>(API.COMMENT.getAllByThisEntity(job_posting_id, "job_posting"), fetcher);

  const { createComment, isCreating } = useCreateComment({
    entity_type: "job_posting",
    entity_id: job_posting_id,
  });

  const onSubmit = async (data: AddQuestionFormValues) => {
    try {
      await createComment(data.content);
      reset();
      setIsModalOpen(false);
      toast.success("Question created successfully");
    } catch (error) {
      if (isRateLimitError(error)) {
        toast.error(ERROR_MESSAGES.TOO_MANY_REQUESTS);

        return; // Return early to avoid showing generic error
      }
      mixpanel.track("Question Content Tab", {
        action: "question_creation_failed",
        job_id: job_posting_id,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
      console.error("Error creating question:", error);
      toast.error("Error creating question, please try again");
    }
  };

  const handleQuestionClick = (questionId: string) => {
    router.push(`/question/${questionId}`);
  };

  const handleAskAQuestion = () => {
    mixpanelTrackAskAQuestion();
    setIsModalOpen(true);
  };

  const mixpanelTrackAskAQuestion = () => {
    mixpanel.track("Question Content Tab", {
      action: "ask_a_question_button_clicked",
      job_id: job_posting_id,
    });
  };

  if (isLoading) return <LoadingContent />;
  if (error) {
    if (isRateLimitError(error)) {
      return <RateLimitErrorMessage />;
    }

    return <ErrorMessageContent message="Error loading questions" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SignedIn>
          <CustomButton onPress={handleAskAQuestion}>Ask a Question</CustomButton>
        </SignedIn>
        <SignedOut>
          <SignInButton fallbackRedirectUrl={pathname} mode="modal">
            <CustomButton onPress={mixpanelTrackAskAQuestion}>Ask a Question</CustomButton>
          </SignInButton>
        </SignedOut>
      </div>

      <SignedIn>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <ModalContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader>Ask a Question</ModalHeader>
              <ModalBody>
                <Controller
                  control={control}
                  name="content"
                  render={({ field, fieldState }) => (
                    <Textarea {...field} isRequired errorMessage={fieldState.error?.message} isInvalid={!!fieldState.error} placeholder="Type your question here..." />
                  )}
                />
              </ModalBody>
              <ModalFooter>
                <CustomButton color="danger" variant="light" onPress={() => setIsModalOpen(false)}>
                  Cancel
                </CustomButton>
                <CustomButton color="primary" isLoading={isCreating} type="submit">
                  Submit Question
                </CustomButton>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </SignedIn>

      {questions.length === 0 && <DataNotFoundMessage className="min-h-[288px]" message="No questions yet" />}

      {questions.length > 0 && <Spacer y={4} />}

      {questions.length > 0 &&
        questions.map((question) => (
          <Card key={question.id} isPressable className="w-full" onPress={() => handleQuestionClick(question.id)}>
            <div className="flex w-full items-center justify-between bg-default-100 px-4 py-3 dark:bg-default-50">
              <div className="flex items-center gap-2">
                <Avatar className="flex-shrink-0" name={question.user_data.full_name} size="sm" src={question.user_data.profile_pic_url} />
                <span className="text-sm text-default-500">{question.user_data.full_name}</span>
              </div>

              <span className="whitespace-nowrap text-sm text-gray-500">{formatHowLongAgo(question.created_at)}</span>
            </div>

            <CardBody>
              <div className="flex flex-col">
                <p className="whitespace-pre-wrap p-1">{question.content}</p>
                <div className="flex justify-end text-small text-gray-500">
                  <span>
                    {question.reply_count} {question.reply_count === 1 ? "comment" : "comments"}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
    </div>
  );
}
