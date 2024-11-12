"use client";

import { Switch, Tooltip } from "@nextui-org/react";
import { useState } from "react";
import { useQueryStates, parseAsBoolean, parseAsInteger, parseAsString } from "nuqs";
import mixpanel from "mixpanel-browser";

import { CustomButton } from "@/components/CustomButton";

export function VerifiedJobsToggle() {
  const [{ page, search, isVerified }, setQueryStates] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault(""),
    isVerified: parseAsBoolean.withDefault(false),
  });

  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const handleTooltipToggle = () => {
    mixpanel.track("Verified Jobs toggle clicked", {
      is_open: isTooltipOpen,
    });
    setIsTooltipOpen(!isTooltipOpen);
  };

  const handleVerifiedToggle = (isSelected: boolean) => {
    mixpanel.track("All Jobs Action", {
      action: "verified_jobs_toggled",
      page_number: page,
      search_query: search,
      is_verified: `from ${isSelected} to ${!isSelected}`,
    });
    setQueryStates({ isVerified: isSelected, page: 1 });
  };

  return (
    <div className="flex items-center">
      <div className="flex items-center gap-2">
        <Tooltip content="Only show jobs that have a verified valid link" isDisabled={!isTooltipOpen} isOpen={isTooltipOpen} placement="top" onOpenChange={(open) => setIsTooltipOpen(open)}>
          <CustomButton
            className="h-auto min-w-0 !gap-1 p-0 text-sm text-default-500 transition-all hover:border-default-300 hover:bg-default-100/50 hover:text-default-600 dark:border-default-100"
            radius="full"
            size="sm"
            variant="light"
            onPress={handleTooltipToggle}
          >
            <span className="text-default-400">?</span>
            Verified
          </CustomButton>
        </Tooltip>
        <Switch color="success" isSelected={isVerified} size="sm" onValueChange={handleVerifiedToggle} />
      </div>
    </div>
  );
}
