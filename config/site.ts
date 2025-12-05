const GITHUB_REPO_URL = "https://github.com/didtheyghostme/didtheyghostme";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "didtheyghost.me",
  description: "Tired of being ghosted by companies? Join didtheyghost.me to track job applications, share interview experiences, and stay updated on SG tech internships",
  githubRepoUrl: GITHUB_REPO_URL,
  navItems: [
    {
      label: "Companies",
      href: "/companies",
    },
    {
      label: "Jobs",
      href: "/jobs",
    },
  ],
  navMenuItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Tutorial",
      href: "/tutorial",
    },
    {
      label: "GitHub",
      href: GITHUB_REPO_URL,
    },
  ],
};
