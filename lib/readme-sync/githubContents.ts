export type GithubContentFileResponse = {
  sha: string;
  content: string; // base64
  encoding: "base64";
};

function getGithubToken(): string {
  const token = process.env.README_SYNC_GITHUB_TOKEN;

  if (!token) throw new Error("Missing README_SYNC_GITHUB_TOKEN");

  return token;
}

function getGithubRepo(): string {
  const repo = process.env.README_SYNC_REPO;

  if (!repo) throw new Error("Missing README_SYNC_REPO (expected: owner/repo)");

  return repo;
}

function getGithubPath(): string {
  return process.env.README_SYNC_PATH ?? "README.md";
}

function getGithubApiBaseUrl(): string {
  return process.env.README_SYNC_GITHUB_API_BASE_URL ?? "https://api.github.com";
}

function decodeBase64ToUtf8(base64: string): string {
  // GitHub contents API may include newlines in the base64 payload
  return Buffer.from(base64.replace(/\n/g, ""), "base64").toString("utf8");
}

function encodeUtf8ToBase64(text: string): string {
  return Buffer.from(text, "utf8").toString("base64");
}

export async function getGithubReadmeFile(params?: { repo?: string; path?: string }): Promise<{ sha: string; content: string }> {
  const repo = params?.repo ?? getGithubRepo();
  const path = params?.path ?? getGithubPath();
  const token = getGithubToken();

  const encodedPath = path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  const url = `${getGithubApiBaseUrl()}/repos/${repo}/contents/${encodedPath}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Failed to fetch README from GitHub (${res.status}): ${await res.text()}`);

  const json = (await res.json()) as GithubContentFileResponse;

  if (json.encoding !== "base64") throw new Error(`Unexpected GitHub content encoding: ${json.encoding}`);

  return { sha: json.sha, content: decodeBase64ToUtf8(json.content) };
}

export async function putGithubReadmeFile(params: { newContent: string; sha: string; message: string; repo?: string; path?: string }): Promise<void> {
  const repo = params.repo ?? getGithubRepo();
  const path = params.path ?? getGithubPath();
  const token = getGithubToken();

  const encodedPath = path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  const url = `${getGithubApiBaseUrl()}/repos/${repo}/contents/${encodedPath}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: params.message,
      content: encodeUtf8ToBase64(params.newContent),
      sha: params.sha,
    }),
  });

  if (!res.ok) throw new Error(`Failed to update README on GitHub (${res.status}): ${await res.text()}`);
}
