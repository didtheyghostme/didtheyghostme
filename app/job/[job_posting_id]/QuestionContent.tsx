"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Card, CardBody, Button, Spacer, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea, Avatar } from "@nextui-org/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { useCreateComment } from "@/lib/hooks/useCreateComment";
import { fetcher } from "@/lib/fetcher";
import { API } from "@/lib/constants/apiRoutes";
import { DBTable } from "@/lib/constants/dbTables";
import { addQuestionSchema, AddQuestionFormValues } from "@/lib/schema/addQuestionSchema";
import { QuestionWithReplyCountResponse } from "@/app/api/comment/route";

type QuestionContentProps = {
  job_posting_id: string;
};

export function QuestionContent({ job_posting_id }: QuestionContentProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { control, handleSubmit, reset } = useForm<AddQuestionFormValues>({
    resolver: zodResolver(addQuestionSchema),
    defaultValues: {
      content: "",
    },
  });

  const { data: questions = [], error, isLoading } = useSWR<QuestionWithReplyCountResponse[]>(API.COMMENT.getAllByThisEntity(job_posting_id, DBTable.JOB_POSTING), fetcher);

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
      console.error("Error creating question:", error);
      toast.error("Error creating question, please try again");
    }
  };

  const handleQuestionClick = (questionId: string) => {
    router.push(`/question/${questionId}`);
  };

  if (isLoading) return <div>Loading questions...</div>;
  if (error) return <div>Error loading questions</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onPress={() => setIsModalOpen(true)}>Ask a Question</Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>Ask a Question</ModalHeader>
            <ModalBody>
              <Controller
                control={control}
                name="content"
                render={({ field, fieldState }) => <Textarea {...field} isRequired errorMessage={fieldState.error?.message} isInvalid={!!fieldState.error} placeholder="Type your question here..." />}
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

      <Spacer y={4} />
      {questions.length === 0 && <div>No questions yet</div>}

      {questions.length > 0 &&
        questions.map((question) => (
          <Card key={question.id} isPressable className="w-full" onPress={() => handleQuestionClick(question.id)}>
            <CardBody>
              <div className="flex flex-col">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="flex-shrink-0" name={question.user.full_name} size="sm" src={question.user.profile_pic_url} />
                    <span className="font-semibold">{question.user.full_name}</span>
                  </div>
                  <span className="whitespace-nowrap text-sm text-gray-500">{formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
                </div>
                <p className="p-1">{question.content}</p>
                <div className="flex justify-end text-sm text-gray-500">
                  <span>
                    {question.reply_count} {question.reply_count === 1 ? "reply" : "replies"}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
    </div>
  );
}
