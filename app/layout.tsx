import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { ClerkProvider } from "@clerk/nextjs";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { ToastProvider } from "@/components/ToastProvider";
import { MixpanelProvider } from "@/components/MixpanelProvider";
import { MainLayout } from "@/components/MainLayout";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body className={clsx("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ClerkProvider>
          <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
            <ToastProvider>
              <NuqsAdapter>
                <MixpanelProvider>
                  <MainLayout>{children}</MainLayout>
                </MixpanelProvider>
              </NuqsAdapter>
            </ToastProvider>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
