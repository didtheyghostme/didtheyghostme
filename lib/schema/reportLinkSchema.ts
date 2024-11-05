import { z } from "zod";

export const REPORT_LINK_TYPES = {
  "Link Expired": "Link Expired",
  "Invalid Link": "Invalid Link",
  "Suggest Link": "Suggest Link",
  Other: "Other",
} as const satisfies Record<ReportAdminReportType, ReportAdminReportType>;

export const reportLinkSchema = z.object({
  report_type: z.nativeEnum(REPORT_LINK_TYPES),
  url: z.string().url().nullable(),
}) satisfies z.ZodType<Pick<ReportAdminTable, "report_type"> & Pick<JobPostingTable, "url">>;

export type ReportLinkFormValues = z.infer<typeof reportLinkSchema>;
