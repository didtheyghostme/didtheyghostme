"use client";

import { Card, CardBody, CardHeader, Avatar } from "@heroui/react";

import { useJobPostingReviews } from "@/lib/hooks/useApplicationReview";
import { LoadingContent } from "@/components/LoadingContent";
import { ErrorMessageContent } from "@/components/ErrorMessageContent";
import { DataNotFoundMessage } from "@/components/DataNotFoundMessage";
import { formatHowLongAgo } from "@/lib/formatDateUtils";

export function ReviewContent({ job_posting_id }: { job_posting_id: string }) {
  const { data: reviews, error, isLoading } = useJobPostingReviews(job_posting_id);

  if (isLoading) return <LoadingContent />;
  if (error) return <ErrorMessageContent message="Failed to load reviews" />;
  if (!reviews) return <DataNotFoundMessage message="Reviews not found" />;
  if (reviews.length === 0) return <DataNotFoundMessage message="No reviews yet" title="No reviews yet" />;

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => (
        <Card key={review.id} className="w-full">
          <CardHeader className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar isBordered src={review.application.user_data.profile_pic_url} />
              <div>
                <p className="text-sm font-medium">{review.application.user_data.full_name}</p>
                <p className="text-xs text-default-500">{formatHowLongAgo(review.created_at)}</p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <p className="whitespace-pre-wrap text-sm text-default-700">{review.content}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
