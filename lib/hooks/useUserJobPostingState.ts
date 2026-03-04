import { API } from "@/lib/constants/apiRoutes";
import { ClerkAuthUserId, mutateWithAuthKey, useSWRMutationWithAuthKey, useSWRWithAuthKey } from "@/lib/hooks/useSWRWithAuthKey";
import { GetJobPostingStateResponse } from "@/app/api/(protected)/job-posting-state/[job_posting_id]/route";

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

export function useJobPostingState(job_posting_id: string, userId: ClerkAuthUserId) {
  const url = userId ? API.PROTECTED.getJobPostingStateByJobPostingId(job_posting_id) : null;

  return useSWRWithAuthKey<GetJobPostingStateResponse>(url, userId);
}

export function useJobPostingStateList(kind: JobPostingStateListKind, userId: ClerkAuthUserId) {
  const url = userId ? API.PROTECTED.getJobPostingStateList({ kind }) : null;

  return useSWRWithAuthKey<JobPostingStateListResponse>(url, userId);
}

export function useUpsertJobPostingState(job_posting_id: string, userId: ClerkAuthUserId) {
  const { trigger, isMutating } = useSWRMutationWithAuthKey<Partial<Pick<UserJobPostingStateTable, "to_apply_at" | "skipped_at" | "note">>, GetJobPostingStateResponse>(
    userId ? API.PROTECTED.getJobPostingStateByJobPostingId(job_posting_id) : null,
    userId,
    async (url, { arg }) => putJson<typeof arg, GetJobPostingStateResponse>(url, arg),
  );

  const mutateLists = () => {
    mutateWithAuthKey(API.PROTECTED.getJobPostingStateList({ kind: "to_apply" }), userId);
    mutateWithAuthKey(API.PROTECTED.getJobPostingStateList({ kind: "skipped" }), userId);
    mutateWithAuthKey(API.PROTECTED.getJobPostingStateList({ kind: "notes" }), userId);
  };

  return {
    upsertJobPostingState: async (arg: Partial<Pick<UserJobPostingStateTable, "to_apply_at" | "skipped_at" | "note">>) => {
      if (!userId) throw new Error("Unauthorized");
      const result = await trigger(arg);

      mutateWithAuthKey(API.PROTECTED.getJobPostingStateByJobPostingId(job_posting_id), userId);
      mutateLists();

      return result;
    },
    isUpdating: isMutating,
  };
}
