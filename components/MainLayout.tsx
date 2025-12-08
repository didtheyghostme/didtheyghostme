"use client";

import { usePathname } from "next/navigation";
import mixpanel from "mixpanel-browser";
import { Link } from "@heroui/react";

import { Navbar } from "@/components/navbar";
import { GithubIcon } from "@/components/icons";
import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";

const HIDE_LOGO_CREDIT_PATHS = [
  "/sign-in",
  "/sign-up",
  "/companies",
  "/question",
  "/terms",
  "/privacy",
  "/contact",
  "/settings",
  "/tutorials",
  // Add any paths where you don't want the logo credit
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const shouldShowLogoCredit = !(
    pathname === "/" || // Exact match for home page
    HIDE_LOGO_CREDIT_PATHS.some((path) => pathname.startsWith(path))
  );

  const handleGithubClick = () => {
    mixpanel.track("Github Link Clicked", {
      action: "footer",
    });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto w-full max-w-7xl flex-grow px-4 pt-8 sm:px-6 sm:pt-16">{children}</main>
      {shouldShowLogoCredit && (
        <div className="container mx-auto w-full max-w-7xl px-6 py-4">
          <div className="text-end">
            <a className="text-xs text-default-400" href="https://logo.dev" rel="noreferrer" target="_blank">
              Logos provided by Logo.dev
            </a>
          </div>
        </div>
      )}

      {/* Footer section */}
      <footer className="container mx-auto w-full max-w-7xl px-6 py-4">
        <div className="relative flex items-center justify-center">
          {/* Centered GitHub link */}
          <Link isExternal className="flex items-center gap-1 text-sm text-default-500 hover:text-default-800" href={siteConfig.githubRepoUrl} onPress={handleGithubClick}>
            <GithubIcon />
            <span className="underline">GitHub repository</span>
          </Link>

          {/* Theme switch positioned absolutely at the right */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <ThemeSwitch />
          </div>
        </div>
      </footer>
    </div>
  );
}
