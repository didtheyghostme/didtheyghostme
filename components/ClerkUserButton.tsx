"use client";

import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import mixpanel from "mixpanel-browser";

import { ApplicationsIcon, ContactIcon } from "./icons";

export const ClerkUserButton = () => {
  const router = useRouter();

  const handleViewMyApplicationsClick = () => {
    mixpanel.track("View My Applications Clicked", {
      component: "ClerkUserButton navbar /applications",
    });

    router.push("/applications");
  };

  const handleContactSupportClick = () => {
    mixpanel.track("Contact Support Clicked", {
      component: "ClerkUserButton navbar /contact",
    });

    router.push("/contact");
  };

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Action label="View my job applications" labelIcon={<ApplicationsIcon />} onClick={handleViewMyApplicationsClick} />
        <UserButton.Action label="Contact Support" labelIcon={<ContactIcon />} onClick={handleContactSupportClick} />
        <UserButton.Action label="manageAccount" />
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
};
