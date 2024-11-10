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
          card: "bg-background",
          headerTitle: "text-foreground",
          headerSubtitle: "text-default-500",
          formField: "text-foreground",
          footer: "text-default-500",
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
