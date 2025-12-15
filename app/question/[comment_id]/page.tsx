"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, Avatar } from "@heroui/react";
import mixpanel from "mixpanel-browser";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

import { CommentSection } from "./CommentSection";

import { API } from "@/lib/constants/apiRoutes";
import { QuestionPageRequest } from "@/app/api/comment/[comment_id]/route";
import { formatHowLongAgo } from "@/lib/formatDateUtils";
import { ArrowLeftIcon, EditIcon } from "@/components/icons";
import { ERROR_MESSAGES, isRateLimitError } from "@/lib/errorHandling";
import { RateLimitErrorMessage } from "@/components/RateLimitErrorMessage";
import { LoadingContent } from "@/components/LoadingContent";
import { DataNotFoundMessage } from "@/components/DataNotFoundMessage";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { useUpdateComment } from "@/lib/hooks/useUpdateComment";
import { EditCommentModal } from "@/components/EditCommentModal";
import { CustomButton } from "@/components/CustomButton";
import { useSWRWithAuthKey } from "@/lib/hooks/useSWRWithAuthKey";

export default function QuestionPage() {
  const { comment_id } = useParams<{ comment_id: string }>();

  const router = useRouter();

  const { userId } = useAuth();

  const { data: question, error, isLoading } = useSWRWithAuthKey<QuestionPageRequest>(API.COMMENT.getById(comment_id), userId);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const { updateComment, isUpdating } = useUpdateComment(
    {
      entity_type: "job_posting",
      comment_id: editingCommentId || "",
    },
    userId,
  );

  if (isLoading) return <LoadingContent />;
  if (error) {
    if (isRateLimitError(error)) {
      return <RateLimitErrorMessage />;
    }

    return <ErrorMessageContent message="Error loading question" />;
  }
  if (!question) return <DataNotFoundMessage message="Question not found" />;

  const handleBackClick = () => {
    mixpanel.track("back_button_clicked", {
      page: "question_page",
      comment_id: comment_id,
    });
    router.push(`/job/${question.entity_id}?tab=Questions`);
  };

  const handleSubmitEditComment = async (content: string) => {
    try {
      await updateComment(content);
      toast.success("Question updated successfully");
      setEditingCommentId(null);
    } catch (error) {
      if (isRateLimitError(error)) {
        toast.error(ERROR_MESSAGES.TOO_MANY_REQUESTS);

        return;
      }
      toast.error("Failed to update question");
    }
  };

  return (
    <div className="">
      <CustomButton className="mb-4" color="primary" startContent={<ArrowLeftIcon />} variant="light" onClick={handleBackClick}>
        Back
      </CustomButton>
      <Card className="mb-8">
        <CardBody>
          <div className="flex items-start space-x-4">
            <Avatar className="flex-shrink-0" name={question.user_data.full_name} src={question.user_data.profile_pic_url} />
            <div className="flex-grow">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-default-500">{question.user_data.full_name}</span>
                <div className="flex items-center gap-2">
                  {question.isCurrentUserItem && (
                    <CustomButton color="primary" size="sm" variant="flat" onPress={() => setEditingCommentId(question.id)}>
                      Edit question
                      <EditIcon />
                    </CustomButton>
                  )}
                  <span className="text-sm text-gray-500">{formatHowLongAgo(question.created_at)}</span>
                </div>
              </div>
              <p className="mb-4 whitespace-pre-wrap text-lg">{question.content}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Add Edit Modal */}
      {editingCommentId && (
        <EditCommentModal initialContent={question.content} isOpen={!!editingCommentId} isUpdating={isUpdating} onClose={() => setEditingCommentId(null)} onSubmit={handleSubmitEditComment} />
      )}

      <CommentSection entity_id={comment_id} entity_type="question" />
    </div>
  );
}
