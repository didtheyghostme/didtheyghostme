"use client";

import NextLink from "next/link";
import clsx from "clsx";
import { Link, Navbar as HeroUINavbar, NavbarContent, NavbarMenu, NavbarItem, NavbarMenuItem, NavbarMenuToggle, Chip } from "@heroui/react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useState } from "react";
import mixpanel from "mixpanel-browser";

import { ClerkUserButton } from "./ClerkUserButton";
import { GithubIcon } from "./icons";
import { NumberTicker } from "./NumberTicker";

import { siteConfig } from "@/config/site";
import { CustomButton } from "@/components/CustomButton";
import { useGithubStars } from "@/lib/hooks/useGithubStars";

export const Navbar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { githubStars, isLoading: githubLoading } = useGithubStars();

  // Track menu toggle
  const handleMenuToggle = (isOpen: boolean) => {
    mixpanel.track("Navbar", {
      action: "menu_toggle",
      state: isOpen ? "opened" : "closed",
    });
    setIsMenuOpen(isOpen);
  };

  // Track navigation clicks
  const handleNavBarClick = (buttonName: string) => {
    mixpanel.track("Navbar", {
      action: "navigation",
      button: buttonName,
      from_path: pathname,
    });
  };

  // Track login click
  const handleLoginClick = () => {
    mixpanel.track("Navbar", {
      action: "login_clicked",
      from_path: pathname,
    });
  };

  // Track GitHub click
  const handleGithubClick = () => {
    mixpanel.track("Github Link Clicked", {
      action: "navbar",
    });
  };

  return (
    <HeroUINavbar
      isMenuOpen={isMenuOpen}
      maxWidth="xl"
      position="sticky"
      // classNames={{
      //   menu: "max-h-fit",
      // }}
      classNames={{
        wrapper: "px-4", // Add consistent padding
        content: "gap-4", // Reduce gap between content
      }}
      onMenuOpenChange={handleMenuToggle}
    >
      {/* Left side: Menu Toggle, Logo and Nav Items */}
      <NavbarContent justify="start">
        <NavbarMenuToggle className="sm:hidden" />

        {/* Mobile Menu */}
        <NavbarMenu>
          <div className="mx-4 mt-2 flex flex-col gap-2">
            {siteConfig.navMenuItems.map((item, index) => (
              <NavbarMenuItem key={`${item}-${index}`}>
                <Link
                  color="foreground"
                  href={item.href}
                  size="lg"
                  onPress={() => {
                    handleNavBarClick(item.label);
                    setIsMenuOpen(false);
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    {item.label}
                    {item.isNew && (
                      <Chip color="primary" size="sm" variant="flat">
                        New
                      </Chip>
                    )}
                  </span>
                </Link>
              </NavbarMenuItem>
            ))}
          </div>
        </NavbarMenu>

        <div className="flex w-full items-center gap-1.5 sm:gap-12">
          {/* Nav Items - Always visible on mobile and desktop */}
          <NextLink href="/" onClick={() => handleNavBarClick("Home")}>
            <p className="hidden text-inherit sm:flex">didtheyghost.me</p>
          </NextLink>

          <ul className="flex items-center gap-6 sm:gap-8">
            {siteConfig.navItems.map((item) => (
              <NavbarItem key={item.href} className={clsx(item.isNew && "hidden md:flex")}>
                <NextLink
                  className={clsx("text-sm transition-colors sm:text-base", pathname === item.href ? "font-medium text-blue-500" : "text-default-500 hover:text-default-900")}
                  href={item.href}
                  onClick={() => handleNavBarClick(item.label)}
                >
                  <span className="inline-flex items-center gap-2">
                    {item.label}
                    {item.isNew && (
                      <Chip color="primary" size="sm" variant="flat">
                        New
                      </Chip>
                    )}
                  </span>
                </NextLink>
              </NavbarItem>
            ))}
          </ul>
        </div>
      </NavbarContent>

      {/* Right side: Theme Switch + Login + Mobile Menu Toggle */}
      <NavbarContent className="gap-2 sm:hidden" justify="end">
        <Link isExternal className="flex items-center" href={siteConfig.githubRepoUrl} showAnchorIcon={false} onPress={handleGithubClick}>
          <GithubIcon className="text-default-600 transition-colors hover:text-default-900" />
        </Link>
        <SignedOut>
          <SignInButton fallbackRedirectUrl={pathname} mode="modal">
            <CustomButton className="bg-[#282828] text-sm font-normal text-white" variant="flat" onClick={handleLoginClick}>
              Login
            </CustomButton>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <ClerkUserButton />
        </SignedIn>
      </NavbarContent>

      {/* Desktop Right side */}
      <NavbarContent className="hidden basis-1/5 sm:flex sm:basis-auto" justify="end">
        <NavbarItem className="hidden sm:flex">
          <Link
            isExternal
            // eslint-disable-next-line max-len
            className="flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-sm text-default-600 transition-all hover:border-default-400 dark:border-default-100 dark:hover:border-default-700"
            href={siteConfig.githubRepoUrl}
            showAnchorIcon={false}
            onPress={handleGithubClick}
          >
            <GithubIcon />
            <span className="hidden md:inline"> Star {!githubLoading && githubStars > 0 && <NumberTicker value={githubStars} />}</span>
          </Link>
        </NavbarItem>

        <NavbarItem className="hidden sm:flex">
          <SignedOut>
            <SignInButton fallbackRedirectUrl={pathname} mode="modal">
              <CustomButton className="bg-[#282828] text-sm font-normal text-white" variant="flat" onClick={handleLoginClick}>
                Login
              </CustomButton>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <ClerkUserButton />
          </SignedIn>
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
