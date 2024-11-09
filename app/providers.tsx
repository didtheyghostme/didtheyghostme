"use client";

import * as React from "react";
import { NextUIProvider } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { SWRConfig } from "swr";

import { APINotFoundError } from "@/lib/errorHandling";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <NextUIProvider locale="en-GB" navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <SWRConfig
          value={{
            shouldRetryOnError: (error) => {
              return !(error instanceof APINotFoundError);
            },
          }}
        >
          {children}
        </SWRConfig>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
