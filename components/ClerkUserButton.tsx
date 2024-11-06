import { UserButton } from "@clerk/nextjs";

import { ApplicationsIcon, ContactIcon } from "./icons";

export const ClerkUserButton = () => {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link href="/applications" label="View my job applications" labelIcon={<ApplicationsIcon />} />
        <UserButton.Link href="/contact" label="Contact Us" labelIcon={<ContactIcon />} />
        <UserButton.Action label="manageAccount" />
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
};
