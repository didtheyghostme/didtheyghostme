import useSWRMutation from "swr/mutation";

import actionCreateComment from "@/app/actions/createComment";
import { API } from "@/lib/constants/apiRoutes";

export type ServerCreateCommentArgs = Pick<CommentTable, "entity_type" | "entity_id" | "content">;

type ClientCreateCommentArgs = StrictOmit<ServerCreateCommentArgs, "content">;

export const useCreateComment = ({ entity_type, entity_id }: ClientCreateCommentArgs) => {
  const { trigger, isMutating } = useSWRMutation(API.COMMENT.getAllByThisEntity(entity_id, entity_type), actionCreateComment);

  return {
    createComment: async (content: string) => {
      try {
        const result = await trigger({ content, entity_type, entity_id });

        return result;
      } catch (err) {
        console.error("Error creating comment:", err);
        throw err;
      }
    },
    isCreating: isMutating,
  };
};
