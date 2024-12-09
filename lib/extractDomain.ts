// e.g. https://www.google.com -> google.com

export function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url);

    return hostname.replace(/^www\./, "");
  } catch (error) {
    return "";
  }
}

export function isLinkedInDomain(url: string | null): boolean {
  if (!url) return false;

  return extractDomain(url).includes("linkedin.com");
}
