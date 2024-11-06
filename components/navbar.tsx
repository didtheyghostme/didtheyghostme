"use client";

import NextLink from "next/link";
import clsx from "clsx";
import { Button, Link, Navbar as NextUINavbar, NavbarContent, NavbarMenu, NavbarItem, NavbarMenuItem, NavbarMenuToggle } from "@nextui-org/react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useState } from "react";
import mixpanel from "mixpanel-browser";

import { ClerkUserButton } from "./ClerkUserButton";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";

export const Navbar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  return (
    <NextUINavbar
      isMenuOpen={isMenuOpen}
      maxWidth="xl"
      position="sticky"
      // classNames={{
      //   menu: "max-h-fit",
      // }}
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
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
          </div>
        </NavbarMenu>

        <div className="flex w-full items-center gap-4 sm:gap-12">
          {/* Nav Items - Always visible on mobile and desktop */}
          <NextLink href="/" onClick={() => handleNavBarClick("Home")}>
            <p className="hidden text-inherit sm:flex">didtheyghost.me</p>
          </NextLink>

          <ul className="flex items-center gap-8">
            {siteConfig.navItems.map((item) => (
              <NavbarItem key={item.href}>
                <NextLink
                  className={clsx("text-sm transition-colors sm:text-base", pathname === item.href ? "font-medium text-blue-500" : "text-default-500 hover:text-default-900")}
                  href={item.href}
                  onClick={() => handleNavBarClick(item.label)}
                >
                  {item.label}
                </NextLink>
              </NavbarItem>
            ))}
          </ul>
        </div>
      </NavbarContent>

      {/* Right side: Theme Switch + Login + Mobile Menu Toggle */}
      <NavbarContent className="basis-1 pl-4 sm:hidden" justify="end">
        <ThemeSwitch />
        <SignedOut>
          <SignInButton fallbackRedirectUrl={pathname} mode="modal">
            <Button className="bg-default-100 text-sm font-normal text-default-600" variant="flat" onClick={() => handleLoginClick()}>
              Login
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <ClerkUserButton />
        </SignedIn>
      </NavbarContent>

      {/* Desktop Right side */}
      <NavbarContent className="hidden basis-1/5 sm:flex sm:basis-auto" justify="end">
        <NavbarItem className="hidden gap-2 sm:flex">
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem className="hidden md:flex">
          <SignedOut>
            <SignInButton fallbackRedirectUrl={pathname} mode="modal">
              <Button className="bg-default-100 text-sm font-normal text-default-600" variant="flat" onClick={() => handleLoginClick()}>
                Login
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <ClerkUserButton />
          </SignedIn>
        </NavbarItem>
      </NavbarContent>
    </NextUINavbar>
  );
};
