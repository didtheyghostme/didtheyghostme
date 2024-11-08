import { Card, CardBody, CardHeader, Link } from "@nextui-org/react";

import { AlertCircleIcon } from "./icons";

type DataNotFoundMessageProps = {
  title?: string;
  message?: string;
};

export function DataNotFoundMessage({ title = "No Results Found", message = "We couldn't find what you're looking for." }: DataNotFoundMessageProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-[500px]">
        <CardHeader className="flex gap-3">
          <AlertCircleIcon className="text-default-400" />
          <p className="text-lg font-semibold text-default-400">{title}</p>
        </CardHeader>
        <CardBody className="flex flex-col items-center text-center">
          <p className="text-gray-600">{message}</p>
          <div className="mt-6">
            <Link showAnchorIcon className="text-primary hover:underline" href="/jobs">
              Browse All Jobs
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
