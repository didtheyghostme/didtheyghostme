"use client";

import { Card, CardBody, CardHeader, Link } from "@nextui-org/react";
import mixpanel from "mixpanel-browser";

import { AlertCircleIcon } from "@/components/icons";
import { CustomButton } from "@/components/CustomButton";

type ErrorMessageContentProps = {
  title?: string;
  message: string;
};

export function ErrorMessageContent({ title = "Error", message }: ErrorMessageContentProps) {
  const handleRefresh = () => {
    mixpanel.track("Refresh Page Clicked", {
      component: "ErrorMessageContent",
      error_message: message,
    });
    window.location.reload();
  };

  const mixpanelTrackContactSupportClick = () => {
    mixpanel.track("Contact Support Clicked", {
      component: "ErrorMessageContent",
      error_message: message,
    });
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-[500px]">
        <CardHeader className="flex gap-3">
          <AlertCircleIcon className="text-red-600" />
          <p className="text-lg font-semibold text-red-600">{title}</p>
        </CardHeader>
        <CardBody className="flex flex-col items-center text-center">
          <p className="text-gray-600">{message}</p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:gap-6">
            <CustomButton className="transition-colors hover:bg-primary-300 hover:text-white" color="primary" variant="bordered" onPress={handleRefresh}>
              Refresh Page
            </CustomButton>

            <Link showAnchorIcon className="text-primary hover:underline" href="/contact" onPress={mixpanelTrackContactSupportClick}>
              Contact Support
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">If the issue persists after refreshing, please contact support.</p>
        </CardBody>
      </Card>
    </div>
  );
}
