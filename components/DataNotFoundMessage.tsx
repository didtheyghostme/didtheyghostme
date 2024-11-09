import { Card, CardBody, CardHeader, cn, Link } from "@nextui-org/react";
import mixpanel from "mixpanel-browser";

import { AlertCircleIcon } from "./icons";

type DataNotFoundMessageProps = {
  title?: string;
  message?: string;
  className?: string;
};

export function DataNotFoundMessage({ title = "No results found", message = "We couldn't find what you're looking for.", className }: DataNotFoundMessageProps) {
  const mixpanelTrackBrowseAllJobsClick = () => {
    mixpanel.track("Browse All Jobs Clicked", {
      component: "DataNotFoundMessage",
      error_message: message,
    });
  };

  return (
    <div className={cn("flex min-h-[400px] items-center justify-center p-4", className)}>
      <Card className="w-full max-w-[500px]">
        <CardHeader className="flex gap-3">
          <AlertCircleIcon className="text-default-400" />
          <p className="text-lg font-semibold text-default-400">{title}</p>
        </CardHeader>
        <CardBody className="flex flex-col items-center text-center">
          <p className="text-gray-600">{message}</p>
          <div className="mt-6">
            <Link showAnchorIcon className="text-primary hover:underline" href="/jobs" onPress={mixpanelTrackBrowseAllJobsClick}>
              Browse All Jobs
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
