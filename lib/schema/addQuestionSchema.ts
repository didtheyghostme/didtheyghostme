import { z } from "zod";

export const addQuestionSchema = z.object({
  content: z.string().min(1, "Question cannot be empty").max(1000, "Question is too long (max 1000 characters)"),
}) satisfies z.ZodType<Pick<CommentTable, "content">>;

export type AddQuestionFormValues = z.infer<typeof addQuestionSchema>;
