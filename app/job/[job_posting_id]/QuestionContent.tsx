"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Card, CardBody, Button, Spacer, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Avatar } from "@nextui-org/react";
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
      mixpanel.track("Question Content Tab", {
        action: "question_creation_failed",
        job_id: job_posting_id,
        error: error,
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

  if (isLoading) return <div>Loading questions...</div>;
  if (error) return <div>Error loading questions</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SignedIn>
          <Button onPress={handleAskAQuestion}>Ask a Question</Button>
        </SignedIn>
        <SignedOut>
          <SignInButton fallbackRedirectUrl={pathname} mode="modal">
            <Button onPress={mixpanelTrackAskAQuestion}>Ask a Question</Button>
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
                <Button color="danger" variant="light" onPress={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button color="primary" isLoading={isCreating} type="submit">
                  Submit Question
                </Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      </SignedIn>

      <Spacer y={4} />
      {questions.length === 0 && <div>No questions yet</div>}

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
