export const JOBS_TABLE_START = "<!-- JOBS_TABLE_START -->";
export const JOBS_TABLE_END = "<!-- JOBS_TABLE_END -->";

export type ReadmeJobRow = {
  companyMarkdown: string;
  roleMarkdown: string;
  trackMarkdown: string;
  applyMarkdown: string;
  addedMarkdown: string; // rendered, e.g. "07 Sep 2025"
};

export type ExistingReadmeRow = {
  rawLine: string;
  cells: string[];
  jobPostingId: string | null; // parsed from TRACK cell
};

type ParsedDate = {
  timestampMs: number;
  display: string;
};

type RowKind = "community" | "db";

type MergedRow = ReadmeJobRow & {
  rowKind: RowKind;
  sortTimestampMs: number;
  tieBreakIndex: number;
};

function isHeaderCell(cell: string): boolean {
  const v = cell.trim().toLowerCase();

  return v === "company" || v === "role" || v === "track" || v === "application" || v === "date added";
}

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

function isEscapedPipe(s: string, pipeIndex: number): boolean {
  // Markdown tables use `|` as delimiter, but `\|` is a literal pipe.
  // A pipe is escaped when it has an odd number of backslashes immediately before it.
  let backslashes = 0;
  for (let i = pipeIndex - 1; i >= 0 && s[i] === "\\"; i--) backslashes++;

  return backslashes % 2 === 1;
}

function splitTableCells(line: string): string[] {
  // "| a | b |" -> ["a","b"]
  const s = line.trim().slice(1, -1); // remove outer pipes
  const cells: string[] = [];
  let cur = "";

  for (let i = 0; i < s.length; i++) {
    const ch = s[i] ?? "";

    if (ch === "|" && !isEscapedPipe(s, i)) {
      cells.push(cur.trim());
      cur = "";
      continue;
    }

    cur += ch;
  }

  cells.push(cur.trim());
  return cells;
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
    const looksLikeHeader = cells.some((c) => isHeaderCell(c));

    const looksLikeSeparator = cells.every((c) => /^:?-+:?$/.test(c) || c === "---");

    if (looksLikeHeader || looksLikeSeparator) {
      headerLines.push(normalized);
      continue;
    }

    // Data row
    const jobPostingId = extractJobPostingIdFromTrackCell(cells);

    rows.push({ rawLine: normalized, cells, jobPostingId });
  }

  return { headerLines, rows, otherLines };
}

function extractJobPostingIdFromTrackCell(cells: string[]): string | null {
  // Expected columns: Company | Role | Track | Application | Date Added
  const trackCell = cells[2] ?? "";
  const match = trackCell.match(/\/job\/([0-9a-fA-F-]{36})/);

  return match?.[1] ?? null;
}

const APPLY_BUTTON_IMG = '<img alt="Apply" src="readme-buttons/apply.svg" width="160" />';
const INVALID_DATE_MARKER = "INVALID (use YYYY-MM-DD)";

const sgDateFormatter = new Intl.DateTimeFormat("en-SG", {
  day: "2-digit", // "07"
  month: "short", // "Sep"
  year: "numeric", // "2025"
  timeZone: "Asia/Singapore",
});

function formatDateSingapore(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";

  return sgDateFormatter.format(date);
}

function parseDateAdded(input: string): ParsedDate | null {
  const raw = input.trim();

  if (!raw) return null;

  // ISO (contributors): YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw);

    if (Number.isNaN(d.getTime())) return null;

    return { timestampMs: d.getTime(), display: formatDateSingapore(d) };
  }

  // Rendered DB format: "07 Sep 2025"
  const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);

  if (m) {
    const day = Number(m[1]);
    const monthRaw = m[2].toLowerCase();
    const year = Number(m[3]);
    const monthMap: Record<string, number> = {
      jan: 0,
      january: 0,
      feb: 1,
      february: 1,
      mar: 2,
      march: 2,
      apr: 3,
      april: 3,
      may: 4,
      jun: 5,
      june: 5,
      jul: 6,
      july: 6,
      aug: 7,
      august: 7,
      sep: 8,
      sept: 8,
      september: 8,
      oct: 9,
      october: 9,
      nov: 10,
      november: 10,
      dec: 11,
      december: 11,
    };
    const month = monthMap[monthRaw];

    if (month === undefined) return null;

    const d = new Date(Date.UTC(year, month, day));

    if (Number.isNaN(d.getTime())) return null;

    return { timestampMs: d.getTime(), display: formatDateSingapore(d) };
  }

  return null;
}

function isPlainHttpUrl(input: string): boolean {
  const v = input.trim();

  return /^https?:\/\/\S+$/i.test(v);
}

function escapeHtmlAttr(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function normalizeCommunityApplyCellToButton(cell: string): string {
  const trimmed = cell.trim();

  if (!trimmed || trimmed === "-") return "-";
  if (!isPlainHttpUrl(trimmed)) return trimmed;

  // Avoid raw pipes in the Markdown row (`|` is the table delimiter).
  const href = escapeHtmlAttr(trimmed.replaceAll("|", "%7C"));

  return `<a href="${href}">${APPLY_BUTTON_IMG}</a>`;
}

function normalizeCommunityRowFromCells(cells: string[]): { row: ReadmeJobRow; parsedDate: ParsedDate | null } | null {
  // Expected columns: Company | Role | Track | Application | Date Added
  if (cells.length < 5) return null;

  const companyMarkdown = cells[0] ?? "";
  const roleMarkdown = cells[1] ?? "";
  const trackMarkdown = cells[2] ?? "";
  const applyMarkdown = normalizeCommunityApplyCellToButton(cells[3] ?? "");
  const originalAdded = (cells[4] ?? "").trim();
  const parsedDate = parseDateAdded(originalAdded);
  const addedMarkdown = parsedDate?.display ?? `${INVALID_DATE_MARKER}: ${originalAdded || "EMPTY_CELL"}`;

  return { row: { companyMarkdown, roleMarkdown, trackMarkdown, applyMarkdown, addedMarkdown }, parsedDate };
}

export function renderJobsTable(params: { headerLines?: string[]; rows: ReadmeJobRow[] }): string {
  const headerLines = params.headerLines?.length && params.headerLines.length >= 2 ? params.headerLines : ["| Company | Role | Track | Application | Date Added |", "|---|---|:---:|:---:|:---:|"];

  const lines = params.rows.map((r) => `| ${r.companyMarkdown} | ${r.roleMarkdown} | ${r.trackMarkdown} | ${r.applyMarkdown} | ${r.addedMarkdown} |`);

  const out: string[] = [];

  out.push("");
  out.push(...headerLines);
  out.push(...lines);
  out.push("");

  return out.join("\n");
}

export function mergeReadmeJobsTable(params: { readme: string; desiredDbRowsById: Map<string, ReadmeJobRow>; desiredDbOrder: string[]; desiredDbSortTimestampMsById?: Map<string, number> }): {
  nextReadme: string;
  changed: boolean;
} {
  const { before, block, after } = extractAnchoredBlock(params.readme);

  const parsed = parseExistingRowsFromBlock(block);

  const mergedRows: MergedRow[] = [];

  // DB rows (source-of-truth): deterministic order from params.desiredDbOrder
  for (let i = 0; i < params.desiredDbOrder.length; i++) {
    const id = params.desiredDbOrder[i];
    const row = params.desiredDbRowsById.get(id);

    if (!row) continue;

    const dbSortTimestampMs = params.desiredDbSortTimestampMsById?.get(id);
    const parsedDate = dbSortTimestampMs === undefined ? parseDateAdded(row.addedMarkdown) : null;

    mergedRows.push({
      ...row,
      rowKind: "db",
      sortTimestampMs: dbSortTimestampMs ?? parsedDate?.timestampMs ?? Number.POSITIVE_INFINITY,
      tieBreakIndex: i,
    });
  }

  // Community rows: taken from existing README table, normalized (Application URL -> button; ISO date -> display)
  const communityRows = parsed.rows.filter((r) => !r.jobPostingId);

  for (let i = 0; i < communityRows.length; i++) {
    const normalized = normalizeCommunityRowFromCells(communityRows[i].cells);

    if (!normalized) continue;

    mergedRows.push({
      ...normalized.row,
      rowKind: "community",
      sortTimestampMs: normalized.parsedDate?.timestampMs ?? Number.POSITIVE_INFINITY,
      tieBreakIndex: i,
    });
  }

  mergedRows.sort((a, b) => {
    if (a.sortTimestampMs !== b.sortTimestampMs) return b.sortTimestampMs - a.sortTimestampMs;
    if (a.rowKind !== b.rowKind) return a.rowKind === "community" ? -1 : 1; // community first on ties

    return a.tieBreakIndex - b.tieBreakIndex;
  });

  const nextBlock = renderJobsTable({ headerLines: parsed.headerLines, rows: mergedRows });

  const nextReadme = `${before}${nextBlock}${after}`;

  const changed = nextReadme !== params.readme;

  return { nextReadme, changed };
}
