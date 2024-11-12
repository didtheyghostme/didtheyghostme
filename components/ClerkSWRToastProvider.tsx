"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { SWRConfig } from "swr";

import { APINotFoundError } from "@/lib/errorHandling";

export function ClerkSWRToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: theme === "dark" ? dark : undefined,
        elements: {
          formButtonPrimary: "bg-black text-white hover:bg-black transition ease-in-out hover:scale-105 dark:border-gray-800 !border dark:!shadow-none",
          socialButtonsBlockButton: `flex items-center justify-center px-4 py-2 
          bg-transparent
          text-black dark:text-white
          !border border-black dark:border-white
          transition ease-in-out
          hover:scale-105
          `,
          headerTitle: "text-foreground",
          headerSubtitle: "text-default-500",
          formField: "text-foreground",
          card: theme === "dark" && "bg-[#212126] [background-image:linear-gradient(rgba(255,255,255,0.03),rgba(255,255,255,0.03))]",
          // Only apply background color to all children
          footer: theme === "dark" && "[&_*]:!bg-[#1a1a1d]",
          footerAction: "w-full items-center justify-center",
          footerActionText: "text-default-500",
          footerActionLink: theme === "dark" && "text-[#cbcbd0]",
          dividerLine: "bg-default-200",
          dividerText: "text-default-500",
        },
      }}
    >
      <SWRConfig
        value={{
          shouldRetryOnError: (error) => {
            return !(error instanceof APINotFoundError);
          },
        }}
      >
        <>
          {children}
          <Toaster richColors theme={theme as "light" | "dark"} />
        </>
      </SWRConfig>
    </ClerkProvider>
  );
}
