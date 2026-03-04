import type { GetApplicationReviewResponse } from "@/app/api/application/[application_id]/review/route";
import type { GetAllReviewsByJobPostingIdResponse } from "@/app/api/job/[job_posting_id]/review/route";
import type { PutApplicationReviewBody } from "@/lib/schema/applicationReviewSchema";

import useSWR from "swr";

import { API } from "@/lib/constants/apiRoutes";
import { fetcher } from "@/lib/fetcher";
import { mutateWithAuthKey, useSWRMutationWithAuthKey, useSWRWithAuthKey, type ClerkAuthUserId } from "@/lib/hooks/useSWRWithAuthKey";

async function putJson<TBody, TResult>(url: string, body: TBody): Promise<TResult> {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => null)) as any;

  if (!res.ok) throw new Error(data?.error ?? "Request failed");

  return data as TResult;
}

export function useJobPostingReviews(job_posting_id: string) {
  return useSWR<GetAllReviewsByJobPostingIdResponse>(API.REVIEW.getAllByJobPostingId(job_posting_id), fetcher);
}

export function useApplicationReview(application_id: string, userId: ClerkAuthUserId) {
  const url = userId ? API.REVIEW.getByApplicationId(application_id) : null;

  return useSWRWithAuthKey<GetApplicationReviewResponse>(url, userId);
}

export function useUpsertApplicationReview(application_id: string, userId: ClerkAuthUserId) {
  const { trigger, isMutating } = useSWRMutationWithAuthKey<PutApplicationReviewBody, GetApplicationReviewResponse>(
    userId ? API.REVIEW.getByApplicationId(application_id) : null,
    userId,
    async (url, { arg }) => putJson<typeof arg, GetApplicationReviewResponse>(url, arg),
  );

  return {
    upsertApplicationReview: async (content: string) => {
      if (!userId) throw new Error("Unauthorized");
      const result = await trigger({ content });

      mutateWithAuthKey(API.REVIEW.getByApplicationId(application_id), userId);

      return result;
    },
    isUpdating: isMutating,
  };
}
