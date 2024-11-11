"use client";

import { Card, CardBody, Avatar, Textarea } from "@nextui-org/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import useSWR from "swr";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import mixpanel from "mixpanel-browser";
import { useState } from "react";

import { API } from "@/lib/constants/apiRoutes";
import { fetcher } from "@/lib/fetcher";
import { useCreateComment } from "@/lib/hooks/useCreateComment";
import { AddCommentFormValues, addCommentSchema } from "@/lib/schema/addCommentSchema";
import { CommentsForThisEntityResponse } from "@/app/api/comment/route";
import { formatHowLongAgo } from "@/lib/formatDateUtils";
import { ERROR_MESSAGES, isRateLimitError } from "@/lib/errorHandling";
import { RateLimitErrorMessage } from "@/components/RateLimitErrorMessage";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { useUpdateComment } from "@/lib/hooks/useUpdateComment";
import { EditIcon } from "@/components/icons";
import { EditCommentModal } from "@/components/EditCommentModal";
import { CustomButton } from "@/components/CustomButton";

type EditingComment = {
  id: string;
  content: string;
} | null;

type CommentSectionProps = { entity_type: "question"; entity_id: string } | { entity_type: "interview_experience"; entity_id: string };

export function CommentSection({ entity_type, entity_id }: CommentSectionProps) {
  const pathname = usePathname();

  const { data: comments, error: commentsError, isLoading: commentsLoading } = useSWR<CommentsForThisEntityResponse>(API.COMMENT.getAllByThisEntity(entity_id, entity_type), fetcher);

  // console.error("comments", comments);

  const { createComment, isCreating } = useCreateComment({
    entity_type,
    entity_id,
  });

  const [editingComment, setEditingComment] = useState<EditingComment>(null);

  const { updateComment, isUpdating } = useUpdateComment({
    entity_type,
    comment_id: editingComment?.id || "",
    entity_id,
  });

  const handleSubmitEditComment = async (content: string) => {
    try {
      await updateComment(content);
      toast.success("Comment updated successfully");
      setEditingComment(null);
    } catch (error) {
      if (isRateLimitError(error)) {
        toast.error(ERROR_MESSAGES.TOO_MANY_REQUESTS);

        return;
      }
      toast.error("Failed to update comment");
    }
  };

  const { control, handleSubmit, reset } = useForm<AddCommentFormValues>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: AddCommentFormValues) => {
    try {
      await createComment(data.content);
      reset();
      toast.success("Comment added successfully");
    } catch (error) {
      mixpanel.track("Error adding comment", {
        entity_type,
        entity_id,
      });
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const mixpanelTrackSignInToAddComment = () => {
    mixpanel.track("Sign In to Add Comment", {
      entity_type,
      entity_id,
    });
  };

  if (commentsLoading) return <LoadingContent />;
  if (commentsError) {
    if (isRateLimitError(commentsError)) {
      return <RateLimitErrorMessage />;
    }

    return <ErrorMessageContent message="Error loading comments" />;
  }

  return (
    <div>
      <SignedIn>
        <form className="mb-8" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            control={control}
            name="content"
            render={({ field, fieldState }) => (
              <Textarea {...field} className="mb-2 w-full" errorMessage={fieldState.error?.message} isInvalid={!!fieldState.error} placeholder="Write your comment..." />
            )}
          />
          <div className="flex justify-end">
            <CustomButton disabled={isCreating} isLoading={isCreating} type="submit">
              {isCreating ? "Commenting..." : "Comment"}
            </CustomButton>
          </div>
        </form>
      </SignedIn>

      <SignedOut>
        <div className="mb-8 rounded-lg border border-gray-200 p-4 text-center">
          <p className="mb-2 text-gray-600">Sign in to join the discussion</p>
          <SignInButton fallbackRedirectUrl={pathname} mode="modal">
            <CustomButton color="primary" variant="flat" onPress={mixpanelTrackSignInToAddComment}>
              Sign In
            </CustomButton>
          </SignInButton>
        </div>
      </SignedOut>

      <h2 className="mb-4 text-2xl font-semibold">Comments</h2>

      {comments?.data.length === 0 && <p>No comments yet</p>}

      {comments?.data &&
        comments.data.length > 0 &&
        comments.data.map((comment) => (
          <Card key={comment.id} className="mb-4">
            <CardBody>
              <div className="flex items-start space-x-4">
                <Avatar className="flex-shrink-0" name={comment.user_data.full_name} src={comment.user_data.profile_pic_url} />
                <div className="flex-grow">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-default-500">{comment.user_data.full_name}</span>

                    <div className="flex items-center gap-2">
                      {comment.isCurrentUserItem && (
                        <CustomButton color="primary" size="sm" variant="flat" onPress={() => setEditingComment({ id: comment.id, content: comment.content })}>
                          Edit Comment
                          <EditIcon />
                        </CustomButton>
                      )}

                      <span className="text-sm text-gray-500">{formatHowLongAgo(comment.created_at)}</span>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}

      {/* Edit Modal */}
      {editingComment && (
        <EditCommentModal initialContent={editingComment.content} isOpen={!!editingComment} isUpdating={isUpdating} onClose={() => setEditingComment(null)} onSubmit={handleSubmitEditComment} />
      )}
    </div>
  );
}
