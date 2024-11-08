"use client";

import { UserButton } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import mixpanel from "mixpanel-browser";

import { ApplicationsIcon, ContactIcon } from "./icons";

export const ClerkUserButton = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleContactSupportClick = () => {
    mixpanel.track("Contact Support Clicked", {
      pathname,
      placement: "ClerkUserButton navbar /contact",
    });

    router.push("/contact");
  };

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link href="/applications" label="View my job applications" labelIcon={<ApplicationsIcon />} />
        <UserButton.Action label="Contact Support" labelIcon={<ContactIcon />} onClick={() => handleContactSupportClick()} />
        <UserButton.Action label="manageAccount" />
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
};
