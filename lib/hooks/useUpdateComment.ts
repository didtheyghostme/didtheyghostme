import useSWRMutation from "swr/mutation";

import { API } from "@/lib/constants/apiRoutes";
import actionUpdateComment from "@/app/actions/updateComment";

type UpdateCommentArgs = { entity_type: "job_posting"; comment_id: string; entity_id?: never } | { entity_type: "question" | "interview_experience"; comment_id: string; entity_id: string };

export const useUpdateComment = (args: UpdateCommentArgs) => {
  const { entity_type, comment_id, entity_id } = args;

  const { trigger, isMutating } = useSWRMutation(
    entity_type === "job_posting" ? API.COMMENT.getById(comment_id) : API.COMMENT.getAllByThisEntity(entity_id, entity_type), // job_posting = question page's main question
    actionUpdateComment,
  );

  return {
    updateComment: async (content: string) => {
      try {
        await trigger({ comment_id, content });
      } catch (err) {
        console.error("Error updating comment:", err);
        throw err;
      }
    },
    isUpdating: isMutating,
  };
};
