import { z } from "zod";

export const putApplicationReviewSchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
});

export type PutApplicationReviewBody = z.infer<typeof putApplicationReviewSchema>;
