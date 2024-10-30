import { UserButton } from "@clerk/nextjs";

import { HeartFilledIcon } from "./icons";

const DotIcon = () => {
  return (
    <svg fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
    </svg>
  );
};

export const ClerkUserButton = () => {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link href="/my-applications" label="View my job applications" labelIcon={<HeartFilledIcon className="pb-2 pr-2" />} />
        <UserButton.Action label="manageAccount" />
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
};
