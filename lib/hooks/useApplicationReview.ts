import type { DeleteApplicationReviewResponse, GetApplicationReviewResponse } from "@/app/api/application/[application_id]/review/route";
import type { GetAllReviewsByJobPostingIdResponse } from "@/app/api/job/[job_posting_id]/review/route";
import type { ClerkAuthUserId } from "@/lib/hooks/useSWRWithAuthKey";
import type { PutApplicationReviewBody } from "@/lib/schema/applicationReviewSchema";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { API } from "@/lib/constants/apiRoutes";
import { fetcher } from "@/lib/fetcher";

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

async function deleteJson<TResult>(url: string): Promise<TResult> {
  const res = await fetch(url, { method: "DELETE" });

  const data = (await res.json().catch(() => null)) as any;

  if (!res.ok) throw new Error(data?.error ?? "Request failed");

  return data as TResult;
}

export function useJobPostingReviews(job_posting_id: string) {
  return useSWR<GetAllReviewsByJobPostingIdResponse>(API.REVIEW.getAllByJobPostingId(job_posting_id), fetcher);
}

export function useApplicationReview(application_id: string) {
  const url = application_id ? API.REVIEW.getByApplicationId(application_id) : null;

  return useSWR<GetApplicationReviewResponse>(url, fetcher);
}

export function useUpsertApplicationReview(application_id: string, userId: ClerkAuthUserId) {
  const url = userId ? API.REVIEW.getByApplicationId(application_id) : null;
  const { trigger, isMutating } = useSWRMutation<GetApplicationReviewResponse, Error, string | null, PutApplicationReviewBody>(
    url,
    async (url, { arg }) => putJson<typeof arg, GetApplicationReviewResponse>(url, arg),
    {
      populateCache: true,
      revalidate: false,
    },
  );

  return {
    upsertApplicationReview: async (content: string) => {
      if (!userId) throw new Error("Unauthorized");

      return trigger({ content });
    },
    isUpdating: isMutating,
  };
}

export function useDeleteApplicationReview(application_id: string, userId: ClerkAuthUserId) {
  const url = userId ? API.REVIEW.getByApplicationId(application_id) : null;
  const { trigger, isMutating } = useSWRMutation<GetApplicationReviewResponse, Error, string | null>(
    url,
    async (url) => {
      await deleteJson<DeleteApplicationReviewResponse>(url);

      return null;
    },
    {
      populateCache: true,
      revalidate: false,
    },
  );

  return {
    deleteApplicationReview: async () => {
      if (!userId) throw new Error("Unauthorized");

      return trigger();
    },
    isDeleting: isMutating,
  };
}
