import { z } from "zod";

export const contactSchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters long").max(1000, "Message must be less than 1000 characters"),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
