"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody, Avatar, Button, Textarea } from "@nextui-org/react";
import { formatDistanceToNow } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { API } from "@/lib/constants/apiRoutes";
import { fetcher } from "@/lib/fetcher";
import { useCreateComment } from "@/lib/hooks/useCreateComment";
import { DBTable } from "@/lib/constants/dbTables";
import { QuestionPageRequest } from "@/app/api/comment/[comment_id]/route";
import { AddCommentFormValues, addCommentSchema } from "@/lib/schema/addCommentSchema";
import { CommentsForThisEntityResponse } from "@/app/api/comment/route";

export default function QuestionPage() {
  const { comment_id } = useParams();

  const router = useRouter();

  const { data: question, error, isLoading } = useSWR<QuestionPageRequest>(API.COMMENT.getById(comment_id as string), fetcher);

  const { data: replies = [], error: repliesError, isLoading: repliesLoading } = useSWR<CommentsForThisEntityResponse[]>(API.COMMENT.getAllByThisEntity(comment_id as string, "question"), fetcher);

  const { createComment, isCreating } = useCreateComment({
    entity_type: "question",
    entity_id: comment_id as string,
  });

  const { control, handleSubmit, reset } = useForm<AddCommentFormValues>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: {
      content: "",
    },
  });

  if (isLoading || repliesLoading) return <div>Loading...</div>;
  if (error || repliesError) return <div>Error loading question</div>;
  if (!question) return <div>Question not found</div>;

  const onSubmit = async (data: AddCommentFormValues) => {
    try {
      await createComment(data.content);
      reset();
      toast.success("Reply added successfully");
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    }
  };

  const handleBackClick = () => {
    router.push(`/job/${question.entity_id}?tab=Questions`);
  };

  return (
    <div className="">
      <Button className="mb-4" onClick={handleBackClick}>
        Back
      </Button>
      <Card className="mb-8">
        <CardBody>
          <div className="flex items-start space-x-4">
            <Avatar name={question.user.full_name} src={question.user.profile_pic_url} />
            <div className="flex-grow">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">{question.user.full_name}</span>
                <span className="text-sm text-gray-500">{formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}</span>
              </div>
              <p className="mb-4 text-lg">{question.content}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <form className="mb-8" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="content"
          render={({ field, fieldState }) => <Textarea {...field} className="mb-2 w-full" errorMessage={fieldState.error?.message} isInvalid={!!fieldState.error} placeholder="Write your reply..." />}
        />
        <div className="flex justify-end">
          <Button disabled={isCreating} type="submit">
            {isCreating ? "Replying..." : "Reply"}
          </Button>
        </div>
      </form>

      <h2 className="mb-4 text-2xl font-semibold">Replies</h2>

      {replies.length === 0 && <p>No replies yet</p>}

      {replies.length > 0 &&
        replies.map((reply) => (
          <Card key={reply.id} className="mb-4">
            <CardBody>
              <div className="flex items-start space-x-4">
                <Avatar name={reply.user.full_name} src={reply.user.profile_pic_url} />
                <div className="flex-grow">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold">{reply.user.full_name}</span>
                    <span className="text-sm text-gray-500">{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                  </div>
                  <p>{reply.content}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
    </div>
  );
}
