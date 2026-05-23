"use client";

import { SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { ClerkUserButton } from "./ClerkUserButton";

import { CustomButton } from "@/components/CustomButton";

type NavbarLoginOrUserButtonProps = {
  fallbackRedirectUrl: string;
  onLoginClick: () => void;
};

export function NavbarLoginOrUserButton({ fallbackRedirectUrl, onLoginClick }: NavbarLoginOrUserButtonProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { isLoaded: isAuthLoaded } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isAuthLoaded) return null;

  return (
    <>
      <SignedOut>
        <SignInButton fallbackRedirectUrl={fallbackRedirectUrl} mode="modal">
          <CustomButton className="bg-[#282828] text-sm font-normal text-white" variant="flat" onClick={onLoginClick}>
            Login
          </CustomButton>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <ClerkUserButton />
      </SignedIn>
    </>
  );
}
