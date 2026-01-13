import { exportSgInternTechVerifiedJobs } from "@/lib/readme-sync/exportSgInternTechVerifiedJobs";
import { getGithubReadmeFile, putGithubReadmeFile } from "@/lib/readme-sync/githubContents";
import { mergeReadmeJobsTable, ReadmeJobRow } from "@/lib/readme-sync/readmeJobsTable";

const UTM_PARAMS = "utm_source=github&utm_medium=readme&utm_campaign=sg-intern-tech";

function getSiteBaseUrl(): string {
  return process.env.README_SYNC_SITE_URL ?? "https://didtheyghost.me";
}

function formatDateYmd(dateInput: string): string {
  const d = new Date(dateInput);

  if (Number.isNaN(d.getTime())) return "";

  return d.toISOString().slice(0, 10);
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
    desiredDbOrder.push(job.jobPostingId);
    desiredDbRowsById.set(job.jobPostingId, {
      companyMarkdown: `[${escapePipes(job.companyName)}](${baseUrl}/company/${job.companyId}?${UTM_PARAMS})`,
      roleMarkdown: escapePipes(job.title),
      trackMarkdown: `[TRACK](${baseUrl}/job/${job.jobPostingId}?${UTM_PARAMS})`,
      applyMarkdown: job.applyUrl ? `[APPLY](${job.applyUrl})` : "-",
      addedMarkdown: formatDateYmd(job.createdAt),
    });
  }

  const { sha, content } = await getGithubReadmeFile();

  const { nextReadme, changed } = mergeReadmeJobsTable({
    readme: content,
    desiredDbRowsById,
    desiredDbOrder,
  });

  if (!changed) {
    console.log("✅ No changes detected. README is already up to date.");

    return { didChange: false, exportedCount: exportJobs.length };
  }
  const commitMessage = `sync(readme): update SG internship tech verified jobs (${exportJobs.length})`;

  console.log("Updating README... with changes detected.");

  await putGithubReadmeFile({
    newContent: nextReadme,
    sha,
    message: commitMessage,
  });

  // Preview logs
  //   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  //   console.log("📝 PREVIEW MODE - No commit will be made");
  //   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  //   console.log(`📊 Exported ${exportJobs.length} jobs`);
  //   console.log(`📝 Commit message: ${commitMessage}`);
  //   console.log(`🔑 Current SHA: ${sha}`);
  //   console.log("\n📋 Jobs to be synced:");
  //   exportJobs.forEach((job, idx) => {
  //     console.log(`  ${idx + 1}. ${job.companyName} - ${job.title} (${job.jobPostingId})`);
  //   });
  //   console.log("\n📄 New README content preview:");
  //   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  //   console.log(nextReadme);
  //   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  return { didChange: true, exportedCount: exportJobs.length, commitMessage };
}
