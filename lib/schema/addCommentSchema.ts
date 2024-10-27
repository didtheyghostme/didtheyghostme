import { z } from "zod";

export const addCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000, "Comment cannot exceed 5000 characters"),
}) satisfies z.ZodType<Pick<CommentTable, "content">>;

export type AddCommentFormValues = z.infer<typeof addCommentSchema>;
