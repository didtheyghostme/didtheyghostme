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
      <Tooltip content="Only show jobs that have a verified valid link" isDisabled={!isTooltipOpen} isOpen={isTooltipOpen} placement="top" onOpenChange={(open) => setIsTooltipOpen(open)}>
        <CustomButton isIconOnly className="p-0 text-sm text-default-400" radius="full" size="sm" variant="light" onPress={() => setIsTooltipOpen(!isTooltipOpen)}>
          ?
        </CustomButton>
      </Tooltip>

      <div className="flex items-center gap-2">
        <span className="text-sm text-default-500">Verified Jobs</span>
        <Switch color="success" isSelected={isVerified} size="sm" onValueChange={handleVerifiedToggle} />
      </div>
    </div>
  );
}
