// e.g. https://www.google.com -> google.com

export function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url);

    return hostname.replace(/^www\./, "");
  } catch (error) {
    return "";
  }
}
