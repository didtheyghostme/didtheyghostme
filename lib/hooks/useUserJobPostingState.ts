import type { JobPostingStateAction } from "@/lib/schema/jobPostingStateActionSchema";

import { GetJobPostingStateResponse } from "@/app/api/(protected)/job-posting-state/[job_posting_id]/route";
import { API } from "@/lib/constants/apiRoutes";
import { ClerkAuthUserId, mutateWithAuthKey, useSWRMutationWithAuthKey, useSWRWithAuthKey } from "@/lib/hooks/useSWRWithAuthKey";

type JobPostingStateListKind = "to_apply" | "skipped" | "notes";

type JobPostingStateListResponse = Array<
  Pick<UserJobPostingStateTable, "job_posting_id" | "to_apply_at" | "skipped_at" | "note" | "created_at" | "updated_at"> & {
    job_posting: Pick<JobPostingTable, "id" | "title"> & {
      company: Pick<CompanyTable, "id" | "company_name" | "logo_url">;
    };
  }
>;

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

function buildOptimisticJobPostingState({
  current,
  action,
  jobPostingId,
  nowIso,
}: {
  current: GetJobPostingStateResponse | undefined;
  action: JobPostingStateAction;
  jobPostingId: string;
  nowIso: string;
}): GetJobPostingStateResponse {
  const base = {
    job_posting_id: jobPostingId,
    to_apply_at: current?.to_apply_at ?? null,
    skipped_at: current?.skipped_at ?? null,
    note: current?.note ?? null,
    created_at: current?.created_at ?? nowIso,
    updated_at: nowIso,
  } satisfies NonNullable<GetJobPostingStateResponse>;

  switch (action.action) {
    case "set_to_apply":
      return { ...base, to_apply_at: nowIso, skipped_at: null };
    case "clear_to_apply":
      return { ...base, to_apply_at: null };
    case "set_skipped":
      return { ...base, skipped_at: nowIso, to_apply_at: null };
    case "clear_skipped":
      return { ...base, skipped_at: null };
    case "set_note":
      return { ...base, note: action.note };
  }
}

export function useJobPostingState(job_posting_id: string, userId: ClerkAuthUserId) {
  const url = userId ? API.PROTECTED.getJobPostingStateByJobPostingId(job_posting_id) : null;

  return useSWRWithAuthKey<GetJobPostingStateResponse>(url, userId);
}

export function useJobPostingStateList(kind: JobPostingStateListKind, userId: ClerkAuthUserId) {
  const url = userId ? API.PROTECTED.getJobPostingStateList({ kind }) : null;

  return useSWRWithAuthKey<JobPostingStateListResponse>(url, userId);
}

export function useUpsertJobPostingState(job_posting_id: string, userId: ClerkAuthUserId) {
  const { trigger, isMutating } = useSWRMutationWithAuthKey<JobPostingStateAction, GetJobPostingStateResponse>(
    userId ? API.PROTECTED.getJobPostingStateByJobPostingId(job_posting_id) : null,
    userId,
    async (url, { arg }) => putJson<typeof arg, GetJobPostingStateResponse>(url, arg),
  );

  const revalidateList = (kind: JobPostingStateListKind) => mutateWithAuthKey(API.PROTECTED.getJobPostingStateList({ kind }), userId);

  const revalidateListsForAction = (action: JobPostingStateAction["action"], nextState: GetJobPostingStateResponse) => {
    if (!nextState) return;

    switch (action) {
      case "set_to_apply":
        revalidateList("to_apply");
        revalidateList("skipped");

        return;
      case "clear_to_apply":
        revalidateList("to_apply");

        return;
      case "set_skipped":
        revalidateList("to_apply");
        revalidateList("skipped");

        return;
      case "clear_skipped":
        revalidateList("skipped");

        return;
      case "set_note": {
        revalidateList("notes");

        if (nextState.skipped_at) {
          revalidateList("skipped");

          return;
        }

        if (nextState.to_apply_at && !nextState.skipped_at) {
          revalidateList("to_apply");
        }

        return;
      }
    }
  };

  return {
    upsertJobPostingState: async (arg: JobPostingStateAction) => {
      if (!userId) throw new Error("Unauthorized");

      const result = await trigger(arg, {
        optimisticData: (current) =>
          buildOptimisticJobPostingState({
            current,
            action: arg,
            jobPostingId: job_posting_id,
            nowIso: new Date().toISOString(),
          }),
        rollbackOnError: true,
        populateCache: true,
        revalidate: false,
      });

      revalidateListsForAction(arg.action, result);

      return result;
    },
    isUpdating: isMutating,
  };
}
