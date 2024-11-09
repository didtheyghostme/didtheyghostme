"use client";

import useSWR from "swr";
import { Card, ScrollShadow } from "@nextui-org/react";
import { format } from "date-fns";

import { API } from "@/lib/constants/apiRoutes";
import { fetcher } from "@/lib/fetcher";

function formatFieldName(field: string): string {
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatValue(value: any): string {
  if (value === null) return "None";
  if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return format(new Date(value), "PPP");
  }

  return String(value);
}

export function JobPostingHistory({ jobPostingId }: { jobPostingId: string }) {
  const { data: changelog, isLoading } = useSWR<JobPostingChangelogTable[]>(API.ADMIN.getJobChangelog(jobPostingId), fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (!changelog || changelog.length === 0) return <div className="flex h-[100px] items-center justify-center">No changelog found</div>;

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Change History</h2>

      <ScrollShadow className="h-[400px]">
        <div className="space-y-4">
          {changelog.map((entry) => (
            <Card key={entry.id} className="bg-content2 p-4">
              <p className="mb-2 text-sm text-default-500">{format(new Date(entry.created_at), "PPpp")}</p>
              {Object.entries(entry.history).map(([field, change]) => (
                <div key={field} className="mt-2">
                  <span className="font-medium">{formatFieldName(field)}:</span>
                  <div className="space-y-1 pl-4">
                    <p className="text-danger-500 line-through">{formatValue(change.old)}</p>
                    <p className="text-success-500">{formatValue(change.new)}</p>
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      </ScrollShadow>
    </div>
  );
}
