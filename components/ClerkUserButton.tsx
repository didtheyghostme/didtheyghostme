"use client";

import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import mixpanel from "mixpanel-browser";

import { ApplicationsIcon, ContactIcon, EditIcon } from "./icons";

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

  const handleSettingsClick = () => {
    mixpanel.track("Default Settings Clicked", {
      component: "ClerkUserButton navbar /settings",
    });

    router.push("/settings");
  };

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Action label="View my job applications" labelIcon={<ApplicationsIcon />} onClick={handleViewMyApplicationsClick} />
        <UserButton.Action label="Contact Support" labelIcon={<ContactIcon />} onClick={handleContactSupportClick} />
        <UserButton.Action label="Default Settings" labelIcon={<EditIcon />} onClick={handleSettingsClick} />
        <UserButton.Action label="manageAccount" />
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
};
