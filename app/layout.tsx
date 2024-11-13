import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { ClerkSWRToastProvider } from "@/components/ClerkSWRToastProvider";
import { MixpanelProvider } from "@/components/MixpanelProvider";
import { MainLayout } from "@/components/MainLayout";
import { NextUIProviders } from "@/components/NextUIProviders";

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
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
    return (
      <html lang="en">
        <body>
          <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <h1 className="mb-4 text-4xl font-bold">Under Maintenance</h1>
            <p className="text-gray-600">We are currently performing some updates. Please check back soon.</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body className={clsx("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <NextUIProviders themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <ClerkSWRToastProvider>
            <NuqsAdapter>
              <MixpanelProvider>
                <MainLayout>{children}</MainLayout>
              </MixpanelProvider>
            </NuqsAdapter>
          </ClerkSWRToastProvider>
        </NextUIProviders>
      </body>
    </html>
  );
}
