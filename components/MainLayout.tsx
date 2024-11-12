"use client";

import { usePathname } from "next/navigation";

import { Navbar } from "@/components/navbar";

const HIDE_LOGO_CREDIT_PATHS = [
  "/sign-in",
  "/sign-up",
  "/companies",
  "/question",
  // Add any paths where you don't want the logo credit
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const shouldShowLogoCredit = !(
    pathname === "/" || // Exact match for home page
    HIDE_LOGO_CREDIT_PATHS.some((path) => pathname.startsWith(path))
  );

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
    </div>
  );
}
