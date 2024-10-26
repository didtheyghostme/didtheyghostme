import { z } from "zod";

export const addCommentSchema = z.object({
  content: z.string().min(1, "Reply cannot be empty").max(5000, "Reply cannot exceed 5000 characters"),
}) satisfies z.ZodType<Pick<CommentTable, "content">>;

export type AddCommentFormValues = z.infer<typeof addCommentSchema>;
