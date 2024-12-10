"use client";

import { Alert, Button } from "@nextui-org/react";
import { usePathname, useRouter } from "next/navigation";
import { SignInButton, useUser } from "@clerk/nextjs";
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import { toast } from "sonner";
import mixpanel from "mixpanel-browser";

import { updateUserIsAwareOfDefaultFilter } from "@/app/actions/updateUserIsAwareOfDefaultFilter";

type ButtonProps = {
  label: string;
  onClick?: () => void;
  color?: "primary" | "default";
  variant?: "flat" | "light";
  className?: string;
  children?: React.ReactNode;
};

type ResponsiveAlertProps = {
  title: string;
  description?: string;
  primaryButton: ButtonProps;
  secondaryButton?: ButtonProps;
};

export function ResponsiveAlert({ title, description, primaryButton, secondaryButton }: ResponsiveAlertProps) {
  return (
    <div className="mb-4 flex w-full flex-col gap-4">
      <Alert
        color="primary"
        variant="faded"
        description={
          <div className="flex w-full flex-col gap-3">
            <div className="min-w-0">
              <p className="font-medium">{title}</p>
              {description && <p className="text-sm text-default-500">{description}</p>}
            </div>
            {/* Mobile buttons - hidden on desktop */}
            <div className={`grid w-full gap-2 sm:hidden ${secondaryButton ? "grid-cols-2" : "grid-cols-1"}`}>
              {primaryButton.children ? (
                primaryButton.children
              ) : (
                <Button className={`w-full ${primaryButton.className}`} color={primaryButton.color || "primary"} size="sm" variant={primaryButton.variant || "flat"} onPress={primaryButton.onClick}>
                  {primaryButton.label}
                </Button>
              )}
              {secondaryButton &&
                (secondaryButton.children ? (
                  secondaryButton.children
                ) : (
                  <Button className={`w-full font-medium text-default-500 underline underline-offset-4 ${secondaryButton.className}`} size="sm" variant="light" onPress={secondaryButton.onClick}>
                    {secondaryButton.label}
                  </Button>
                ))}
            </div>
          </div>
        }
        endContent={
          // Desktop buttons - hidden on mobile
          <div className="hidden sm:flex sm:gap-3">
            {primaryButton.children ? (
              primaryButton.children
            ) : (
              <Button className={primaryButton.className} color={primaryButton.color || "primary"} size="sm" variant={primaryButton.variant || "flat"} onPress={primaryButton.onClick}>
                {primaryButton.label}
              </Button>
            )}
            {secondaryButton &&
              (secondaryButton.children ? (
                secondaryButton.children
              ) : (
                <Button className={`font-medium text-default-500 underline underline-offset-4 ${secondaryButton.className}`} size="sm" variant="light" onPress={secondaryButton.onClick}>
                  {secondaryButton.label}
                </Button>
              ))}
          </div>
        }
      />
    </div>
  );
}

const DEFAULT_FILTERS = {
  countries: ["Singapore"],
  experienceLevels: ["Internship"],
  jobCategories: ["Tech"],
} as const;

export function checkIfEmptyOrDefaultFilter(countries: string[], experienceLevels: string[], jobCategories: string[]): boolean {
  return (
    (countries.length === 0 || (countries.length === 1 && countries[0] === DEFAULT_FILTERS.countries[0])) &&
    (experienceLevels.length === 0 || (experienceLevels.length === 1 && experienceLevels[0] === DEFAULT_FILTERS.experienceLevels[0])) &&
    (jobCategories.length === 0 || (jobCategories.length === 1 && jobCategories[0] === DEFAULT_FILTERS.jobCategories[0]))
  );
}

export function JobFilterAlert() {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const pathname = usePathname();

  const [{ countries, experienceLevelNames, jobCategoryNames }] = useQueryStates({
    countries: parseAsArrayOf(parseAsString).withDefault([]),
    experienceLevelNames: parseAsArrayOf(parseAsString).withDefault([]),
    jobCategoryNames: parseAsArrayOf(parseAsString).withDefault([]),
  });

  const isEmptyOrDefaultFilter = checkIfEmptyOrDefaultFilter(countries, experienceLevelNames, jobCategoryNames);

  //   console.warn("isloaded", isLoaded, user?.publicMetadata.isAwareOfDefaultFilter, countries, experienceLevelNames, jobCategoryNames);

  // Wait for Clerk to load to prevent flashing issues on UI
  if (!isLoaded) return null;

  // Not signed in
  if (!isSignedIn) {
    // Show default alert if filters are empty
    if (isEmptyOrDefaultFilter) {
      return (
        <ResponsiveAlert
          description="Sign in to set your default filters."
          title="Current default filter is Singapore, Tech, Internship."
          primaryButton={{
            label: "Sign in",
            children: (
              <SignInButton fallbackRedirectUrl={pathname} mode="modal">
                <Button className="w-full sm:w-auto" color="primary" size="sm" variant="flat">
                  Sign in
                </Button>
              </SignInButton>
            ),
          }}
        />
      );
    }

    return null;
  }

  const isAwareOfDefaultFilter = user?.publicMetadata.isAwareOfDefaultFilter ?? false;

  const handleDismiss = async () => {
    try {
      await updateUserIsAwareOfDefaultFilter();
      mixpanel.track("User dismisses default filter alert", {
        countries,
        experienceLevelNames,
        jobCategoryNames,
        isEmptyOrDefaultFilter,
      });
      toast.success("Alert will not show again");

      await user?.reload();
    } catch (error) {
      toast.error("Failed to update isAwareOfDefaultFilter status");
      mixpanel.track("Failed to update isAwareOfDefaultFilter status", {
        error: error,
      });
    }
  };

  // Signed in but not aware of default filter - show filter alert
  console.warn("signedin", isSignedIn, isAwareOfDefaultFilter, isEmptyOrDefaultFilter);
  if (!isAwareOfDefaultFilter && isEmptyOrDefaultFilter) {
    return (
      <ResponsiveAlert
        description="Set your default filters to save your job search preferences."
        title="Current default filter is Singapore, Tech, Internship."
        primaryButton={{
          label: "Change default filters",
          onClick: () => router.push("/settings"),
        }}
        secondaryButton={{
          label: "Don't show again",
          onClick: handleDismiss,
        }}
      />
    );
  }

  // User is signed in and aware of default filter
  return null;
}
