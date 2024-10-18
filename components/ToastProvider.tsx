"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <>
      {children}
      <Toaster richColors theme={theme as "light" | "dark"} />
    </>
  );
}
