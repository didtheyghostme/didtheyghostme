export const JOBS_TABLE_START = "<!-- JOBS_TABLE_START -->";
export const JOBS_TABLE_END = "<!-- JOBS_TABLE_END -->";

export type ReadmeJobRow = {
  companyMarkdown: string;
  roleMarkdown: string;
  trackMarkdown: string;
  applyMarkdown: string;
  addedMarkdown: string; // YYYY-MM-DD
};

export type ExistingReadmeRow = {
  rawLine: string;
  jobPostingId: string | null; // parsed from TRACK cell
};

export function extractAnchoredBlock(readme: string): { before: string; block: string; after: string } {
  const startIdx = readme.indexOf(JOBS_TABLE_START);
  const endIdx = readme.indexOf(JOBS_TABLE_END);

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`README is missing table anchors (${JOBS_TABLE_START} / ${JOBS_TABLE_END}). Add them to the sync repo README.md.`);
  }

  const before = readme.slice(0, startIdx + JOBS_TABLE_START.length);
  const block = readme.slice(startIdx + JOBS_TABLE_START.length, endIdx);
  const after = readme.slice(endIdx);

  return { before, block, after };
}

function normalizeTableLine(line: string): string {
  return line.trim();
}

function isTableRowLine(line: string): boolean {
  const t = line.trim();

  return t.startsWith("|") && t.endsWith("|") && t.split("|").length >= 3;
}

function splitTableCells(line: string): string[] {
  // "| a | b |" -> ["a","b"]
  return line
    .trim()
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim());
}

export function parseExistingRowsFromBlock(block: string): { headerLines: string[]; rows: ExistingReadmeRow[]; otherLines: string[] } {
  const lines = block.split("\n");

  const headerLines: string[] = [];
  const rows: ExistingReadmeRow[] = [];
  const otherLines: string[] = [];

  for (const line of lines) {
    const normalized = normalizeTableLine(line);

    if (!normalized) {
      otherLines.push(line);
      continue;
    }

    if (!isTableRowLine(normalized)) {
      otherLines.push(line);
      continue;
    }

    const cells = splitTableCells(normalized);
    // const looksLikeHeader = cells.some((c) => /company|role|track|apply|added/i.test(c));
    const looksLikeHeader = cells.some((c) => /^(company|role|track|apply|added)$/i.test(c));
    // const normalizedCells = cells.map((c) => c.trim().toLowerCase());
    // const looksLikeHeader = normalizedCells[0] === "company" && normalizedCells[1] === "role" && normalizedCells[2] === "track" && normalizedCells[3] === "apply" && normalizedCells[4] === "added";

    const looksLikeSeparator = cells.every((c) => /^:?-+:?$/.test(c) || c === "---");

    if (looksLikeHeader || looksLikeSeparator) {
      headerLines.push(normalized);
      continue;
    }

    // Data row
    const jobPostingId = extractJobPostingIdFromTrackCell(cells);

    rows.push({ rawLine: normalized, jobPostingId });
  }

  return { headerLines, rows, otherLines };
}

function extractJobPostingIdFromTrackCell(cells: string[]): string | null {
  // Expected columns: Company | Role | Track | Apply | Added
  const trackCell = cells[2] ?? "";
  const match = trackCell.match(/\/job\/([0-9a-fA-F-]{36})/);

  return match?.[1] ?? null;
}

export function renderJobsTable(params: { headerLines?: string[]; dbRows: ReadmeJobRow[]; preservedCommunityLines: string[] }): string {
  const headerLines = params.headerLines?.length && params.headerLines.length >= 2 ? params.headerLines : ["| Company | Role | Track | Apply | Added |", "|---|---|---|---|---:|"];

  const dbLines = params.dbRows.map((r) => `| ${r.companyMarkdown} | ${r.roleMarkdown} | ${r.trackMarkdown} | ${r.applyMarkdown} | ${r.addedMarkdown} |`);

  const out: string[] = [];

  out.push("");
  out.push(...headerLines);
  out.push(...dbLines);
  if (params.preservedCommunityLines.length > 0) out.push(...params.preservedCommunityLines);
  out.push("");

  return out.join("\n");
}

export function mergeReadmeJobsTable(params: { readme: string; desiredDbRowsById: Map<string, ReadmeJobRow>; desiredDbOrder: string[] }): { nextReadme: string; changed: boolean } {
  const { before, block, after } = extractAnchoredBlock(params.readme);

  const parsed = parseExistingRowsFromBlock(block);

  const preservedCommunityLines = parsed.rows.filter((r) => !r.jobPostingId).map((r) => r.rawLine);

  const dbRows: ReadmeJobRow[] = [];

  for (const id of params.desiredDbOrder) {
    const row = params.desiredDbRowsById.get(id);

    if (row) dbRows.push(row);
  }

  const nextBlock = renderJobsTable({
    headerLines: parsed.headerLines,
    dbRows,
    preservedCommunityLines,
  });

  const nextReadme = `${before}${nextBlock}${after}`;

  const changed = nextReadme !== params.readme;

  // Debug logging to find why changes are detected
  if (changed) {
    console.log("=== DEBUG: Why changed? ===");
    console.log("Old length:", params.readme.length);
    console.log("New length:", nextReadme.length);

    // Find first difference
    for (let i = 0; i < Math.max(nextReadme.length, params.readme.length); i++) {
      if (nextReadme[i] !== params.readme[i]) {
        console.log("First diff at index:", i);
        console.log("Old:", JSON.stringify(params.readme.slice(Math.max(0, i - 30), i + 30)));
        console.log("New:", JSON.stringify(nextReadme.slice(Math.max(0, i - 30), i + 30)));
        break;
      }
    }
  } else {
    console.log("✅ No changes detected - README matches expected output");
  }

  return { nextReadme, changed };
}
