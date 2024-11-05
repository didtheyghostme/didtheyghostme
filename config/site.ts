export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "didtheyghost.me",
  description: "Tired of being ghosted by companies? Join didtheyghost.me to track job applications, share interview experiences, and stay updated on SG tech internships",
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
  ],
};
