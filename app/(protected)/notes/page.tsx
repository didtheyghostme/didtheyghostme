"use client";

import NextLink from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Card, CardBody, CardHeader } from "@heroui/react";

import { useJobPostingStateList } from "@/lib/hooks/useUserJobPostingState";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { DataNotFoundMessage } from "@/components/DataNotFoundMessage";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { CustomButton } from "@/components/CustomButton";

export default function NotesPage() {
  const { userId } = useAuth();
  const { data: noteItems, error, isLoading } = useJobPostingStateList("notes", userId);

  if (isLoading) return <LoadingContent />;
  if (error) return <ErrorMessageContent message="Failed to load notes" />;
  if (!noteItems) return <ErrorMessageContent message="No notes found" />;

  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">Jobs with notes</h1>
        <CustomButton as={NextLink} color="secondary" href="/applications" variant="flat">
          Back
        </CustomButton>
      </div>

      {noteItems.length === 0 ? (
        <DataNotFoundMessage message="You haven't added any notes yet." title="No notes" />
      ) : (
        <div className="flex flex-col gap-4">
          {noteItems.map((item) => (
            <Card key={item.job_posting.id} className="w-full">
              <CardHeader className="flex flex-row items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
                  <ImageWithFallback
                    alt={item.job_posting.company.company_name}
                    className="h-full w-full rounded-lg object-cover"
                    companyName={item.job_posting.company.company_name}
                    src={item.job_posting.company.logo_url}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold">{item.job_posting.title}</p>
                  <p className="text-sm text-default-500">{item.job_posting.company.company_name}</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-2">
                  {item.note && <p className="whitespace-pre-wrap text-sm text-default-600">{item.note}</p>}
                  <div>
                    <CustomButton as={NextLink} color="secondary" href={`/job/${item.job_posting.id}`} variant="flat">
                      View Job Post
                    </CustomButton>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
