import { z } from "zod";

export const REPORT_LINK_TYPES = {
  "Link Expired": "Link Expired",
  "Invalid Link": "Invalid Link",
  "Suggest Link": "Suggest Link",
  Other: "Other",
} as const satisfies Record<ReportJobPostingType, ReportJobPostingType>;

export const reportLinkSchema = z
  .object({
    report_type: z.nativeEnum(REPORT_LINK_TYPES),
    url: z.string().url().nullable(),
    report_message: z.string().nullable(),
  })
  .refine(
    (data) => {
      if (data.report_type === "Other") {
        return !!data.report_message && data.report_message.trim().length >= 10 && data.report_message.trim().length <= 500;
      }

      return true;
    },
    {
      message: "Description must be between 10 and 500 characters",
      path: ["report_message"],
    },
  ) satisfies z.ZodType<Pick<ReportAdminTable, "report_type"> & Pick<JobPostingTable, "url"> & { report_message: string | null }>;

export type ReportLinkFormValues = z.infer<typeof reportLinkSchema>;
