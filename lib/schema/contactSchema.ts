import { z } from "zod";

export const CONTACT_TYPES = {
  "Bug Report": "Found an issue with the website's functionality",
  "Feature Request": "Suggest a new feature or improvement",
  "Data Issue": "Report incorrect job or company information",
  "General Feedback": "Share your thoughts about the platform",
} as const satisfies Record<ContactType, string>;

export const contactSchema = z.object({
  contactType: z.enum(Object.keys(CONTACT_TYPES) as [ContactType, ...ContactType[]], {
    required_error: "Please select a contact type",
  }),
  message: z.string().min(10, "Message must be at least 10 characters long").max(1000, "Message must be less than 1000 characters"),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
