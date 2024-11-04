export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "didtheyghost.me",
  description: "Make beautiful websites regardless of your design experience.",
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
      label: "Job Postings",
      href: "/profile",
    },
    {
      label: "Companies",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/nextui-org/nextui",
    twitter: "/company",
    docs: "https://nextui.org",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
