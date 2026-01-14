import { exportSgInternTechVerifiedJobs } from "@/lib/readme-sync/exportSgInternTechVerifiedJobs";
import { getGithubReadmeFile, putGithubReadmeFile } from "@/lib/readme-sync/githubContents";
import { mergeReadmeJobsTable, ReadmeJobRow } from "@/lib/readme-sync/readmeJobsTable";

const UTM_PARAMS = "utm_source=github&utm_medium=readme&utm_campaign=sg-intern-tech";

function getSiteBaseUrl(): string {
  return process.env.README_SYNC_SITE_URL ?? "https://didtheyghost.me";
}

const sgDateFormatter = new Intl.DateTimeFormat("en-SG", {
  day: "2-digit", // "07"
  month: "short", // "Sep"
  year: "numeric", // "2025"
  timeZone: "Asia/Singapore",
});

function createShieldButton(params: { label: string; color: string }): string {
  const query = new URLSearchParams({
    // Shields rejects empty `message`, so we render as a single-segment badge by
    // leaving `label` blank and putting the button text in `message`.
    label: "",
    message: params.label.toUpperCase(),
    color: params.color,
    labelColor: params.color,
    style: "for-the-badge",
  });

  return `https://img.shields.io/static/v1?${query.toString()}`;
}

function formatDateSingapore(dateInput: string): string {
  const d = new Date(dateInput);

  if (Number.isNaN(d.getTime())) return "";

  return sgDateFormatter.format(d);
}

function escapePipes(text: string): string {
  // Markdown tables use `|` as delimiter
  return text.replaceAll("|", "\\|");
}

export type SyncReadmeResult = {
  didChange: boolean;
  exportedCount: number;
  commitMessage?: string;
};

export async function syncReadmeSgInternTechVerifiedJobs(): Promise<SyncReadmeResult> {
  const baseUrl = getSiteBaseUrl().replace(/\/$/, "");

  const exportJobs = await exportSgInternTechVerifiedJobs();

  const desiredDbRowsById = new Map<string, ReadmeJobRow>();
  const desiredDbOrder: string[] = [];

  for (const job of exportJobs) {
    const trackHref = `${baseUrl}/job/${job.jobPostingId}?${UTM_PARAMS}`;
    const trackBtn = createShieldButton({ label: "Track", color: "6B7280" });
    const applyBtn = createShieldButton({ label: "Apply", color: "4B5563" });

    desiredDbOrder.push(job.jobPostingId);
    desiredDbRowsById.set(job.jobPostingId, {
      companyMarkdown: `[${escapePipes(job.companyName)}](${baseUrl}/company/${job.companyId}?${UTM_PARAMS})`,
      roleMarkdown: escapePipes(job.title),
      trackMarkdown: `<a href="${trackHref}"><img alt="Track" src="${trackBtn}" /></a>`,
      applyMarkdown: job.applyUrl ? `<a href="${job.applyUrl}"><img alt="Apply" src="${applyBtn}" /></a>` : "-",
      addedMarkdown: formatDateSingapore(job.createdAt),
    });
  }

  const { sha, content } = await getGithubReadmeFile();

  const { nextReadme, changed } = mergeReadmeJobsTable({
    readme: content,
    desiredDbRowsById,
    desiredDbOrder,
  });

  if (!changed) {
    return { didChange: false, exportedCount: exportJobs.length };
  }

  const commitMessage = `sync(readme): update SG internship tech verified jobs (${exportJobs.length})`;

  await putGithubReadmeFile({
    newContent: nextReadme,
    sha,
    message: commitMessage,
  });

  return { didChange: true, exportedCount: exportJobs.length, commitMessage };
}
