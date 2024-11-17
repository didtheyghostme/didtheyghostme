"use client";

import { Switch, Tooltip } from "@nextui-org/react";
import { useState } from "react";
import mixpanel from "mixpanel-browser";

import { CustomButton } from "@/components/CustomButton";

type VerifiedJobsToggleProps = {
  isVerified: boolean;
  onVerifiedChange: (isVerified: boolean) => void;
};

export function VerifiedJobsToggle({ isVerified, onVerifiedChange }: VerifiedJobsToggleProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const handleTooltipToggle = () => {
    mixpanel.track("Verified Jobs toggle clicked", {
      is_open: isTooltipOpen,
    });
    setIsTooltipOpen(!isTooltipOpen);
  };

  return (
    <div className="flex items-center">
      <div className="flex items-center gap-2">
        <Tooltip content="Only show jobs that have a verified valid link" isDisabled={!isTooltipOpen} isOpen={isTooltipOpen} placement="top" onOpenChange={(open) => setIsTooltipOpen(open)}>
          <CustomButton className="h-auto min-w-0 !gap-1 p-0 text-sm text-default-500" radius="full" size="sm" variant="light" onPress={handleTooltipToggle}>
            <span className="text-default-400">?</span>
            Verified
          </CustomButton>
        </Tooltip>
        <Switch color="success" isSelected={isVerified} size="sm" onValueChange={onVerifiedChange} />
      </div>
    </div>
  );
}
