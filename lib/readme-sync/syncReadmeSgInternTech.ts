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

function createReadmeButtonImg(params: { buttonType: "track" | "apply"; width?: number }): string {
  const src = `readme-buttons/${params.buttonType}.svg`;
  const widthAttr = params.width ? ` width="${params.width}"` : "";

  return `<img alt="${params.buttonType === "apply" ? "Apply" : "Track"}" src="${src}"${widthAttr} />`;
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
    const trackBtn = createReadmeButtonImg({ buttonType: "track", width: 220 });
    const applyBtn = createReadmeButtonImg({ buttonType: "apply", width: 220 });

    desiredDbOrder.push(job.jobPostingId);
    desiredDbRowsById.set(job.jobPostingId, {
      companyMarkdown: `[${escapePipes(job.companyName)}](${baseUrl}/company/${job.companyId}?${UTM_PARAMS})`,
      roleMarkdown: escapePipes(job.title),
      trackMarkdown: `<a href="${trackHref}">${trackBtn}</a>`,
      applyMarkdown: job.applyUrl ? `<a href="${job.applyUrl}">${applyBtn}</a>` : "-",
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
