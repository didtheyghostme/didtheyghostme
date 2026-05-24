"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { ClerkUserButton } from "./ClerkUserButton";

import { CustomButton } from "@/components/CustomButton";

type NavbarLoginOrUserButtonProps = {
  fallbackRedirectUrl: string;
  onLoginClick: () => void;
};

export function NavbarLoginOrUserButton({ fallbackRedirectUrl, onLoginClick }: NavbarLoginOrUserButtonProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const canRenderAuthButton = isMounted && isAuthLoaded;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!canRenderAuthButton) return <div aria-hidden="true" className="h-10 w-20 shrink-0" />;

  if (isSignedIn)
    return (
      <div className="flex h-10 shrink-0 items-center justify-end">
        <ClerkUserButton />
      </div>
    );

  return (
    <div className="flex h-10 w-20 shrink-0 items-center justify-end">
      <SignInButton fallbackRedirectUrl={fallbackRedirectUrl} mode="modal">
        <CustomButton className="bg-[#282828] text-sm font-normal text-white" variant="flat" onClick={onLoginClick}>
          Login
        </CustomButton>
      </SignInButton>
    </div>
  );
}
