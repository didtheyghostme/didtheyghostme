import type { JobPostingStateAction } from "@/lib/schema/jobPostingStateActionSchema";

import { useCallback, useEffect, useRef } from "react";

import { GetJobPostingStateResponse } from "@/app/api/(protected)/job-posting-state/[job_posting_id]/route";
import { API } from "@/lib/constants/apiRoutes";
import { ClerkAuthUserId, mutateWithAuthKey, useSWRMutationWithAuthKey, useSWRWithAuthKey } from "@/lib/hooks/useSWRWithAuthKey";

type JobPostingStateListKind = "to_apply" | "skipped" | "notes";
type JobPostingStateToggleAction = Exclude<JobPostingStateAction, { action: "set_note" }>;

const JOB_POSTING_STATE_LIST_KINDS = ["to_apply", "skipped", "notes"] as const satisfies readonly JobPostingStateListKind[];
const JOB_POSTING_STATE_SYNC_CHANNEL_NAME = "job-posting-state-sync";
const JOB_POSTING_STATE_SYNC_TAB_ID_STORAGE_KEY = "job-posting-state-sync-tab-id";
const JOB_POSTING_STATE_SYNC_PHASE_RANK: Record<JobPostingStateSyncPhase, number> = {
  optimistic: 1,
  confirm: 2,
  rollback: 2,
};

type JobPostingStateListResponse = Array<
  Pick<UserJobPostingStateTable, "job_posting_id" | "to_apply_at" | "skipped_at" | "note" | "created_at" | "updated_at"> & {
    job_posting: Pick<JobPostingTable, "id" | "title"> & {
      company: Pick<CompanyTable, "id" | "company_name" | "logo_url">;
    };
  }
>;

type JobPostingStateListItem = JobPostingStateListResponse[number];
type JobPostingStateSyncPhase = "optimistic" | "confirm" | "rollback";
type JobPostingStateSyncState = GetJobPostingStateResponse | undefined;
type JobPostingStateSyncKnownState = Exclude<JobPostingStateSyncState, undefined>;
type JobPostingStateSyncJobPosting = JobPostingStateListItem["job_posting"];
type JobPostingStateSyncMessage = {
  type: "job-posting-state-sync";
  phase: JobPostingStateSyncPhase;
  kinds: readonly JobPostingStateListKind[];
  mutationSeq: number;
  originTabId: string;
  jobPostingId: string;
  state: JobPostingStateSyncState;
  jobPosting: JobPostingStateSyncJobPosting;
  userId: string;
};
type JobPostingStateSyncMarker = {
  mutationSeq: number;
  phase: JobPostingStateSyncPhase;
};

let cachedJobPostingStateSyncTabId: string | null = null;

async function putJson<TBody, TResult>(url: string, body: TBody): Promise<TResult> {
  const res = await fetch(url, {
    method: "PUT",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => null)) as any;

  if (!res.ok) throw new Error(data?.error ?? "Request failed");

  return data as TResult;
}

function getJobPostingStateSyncTabId() {
  if (cachedJobPostingStateSyncTabId) return cachedJobPostingStateSyncTabId;
  if (typeof window === "undefined") return null;

  const existingTabId = window.sessionStorage.getItem(JOB_POSTING_STATE_SYNC_TAB_ID_STORAGE_KEY);

  if (existingTabId) {
    cachedJobPostingStateSyncTabId = existingTabId;

    return existingTabId;
  }

  const nextTabId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

  window.sessionStorage.setItem(JOB_POSTING_STATE_SYNC_TAB_ID_STORAGE_KEY, nextTabId);
  cachedJobPostingStateSyncTabId = nextTabId;

  return nextTabId;
}

function getJobPostingStateSyncMessageKey(message: Pick<JobPostingStateSyncMessage, "jobPostingId" | "originTabId">) {
  return `${message.originTabId}:${message.jobPostingId}`;
}

function isStaleJobPostingStateSyncMessage(latestSyncMarkersByKey: Map<string, JobPostingStateSyncMarker>, message: JobPostingStateSyncMessage) {
  const messageKey = getJobPostingStateSyncMessageKey(message);
  const currentMarker = latestSyncMarkersByKey.get(messageKey);

  if (!currentMarker) {
    latestSyncMarkersByKey.set(messageKey, {
      mutationSeq: message.mutationSeq,
      phase: message.phase,
    });

    return false;
  }

  if (message.mutationSeq < currentMarker.mutationSeq) return true;

  if (message.mutationSeq === currentMarker.mutationSeq && JOB_POSTING_STATE_SYNC_PHASE_RANK[message.phase] <= JOB_POSTING_STATE_SYNC_PHASE_RANK[currentMarker.phase]) return true;

  latestSyncMarkersByKey.set(messageKey, {
    mutationSeq: message.mutationSeq,
    phase: message.phase,
  });

  return false;
}

function isJobPostingStateInListKind(state: JobPostingStateSyncKnownState, kind: JobPostingStateListKind) {
  if (!state) return false;

  switch (kind) {
    case "to_apply":
      return !!state.to_apply_at && !state.skipped_at;
    case "skipped":
      return !!state.skipped_at;
    case "notes":
      return !!state.note;
  }
}

function buildJobPostingStateListItem(state: NonNullable<JobPostingStateSyncKnownState>, jobPosting: JobPostingStateSyncJobPosting): JobPostingStateListItem {
  return {
    ...state,
    job_posting: jobPosting,
  };
}

function applyJobPostingStateToList({
  current,
  kind,
  jobPostingId,
  state,
  jobPosting,
}: {
  current: JobPostingStateListResponse | undefined;
  kind: JobPostingStateListKind;
  jobPostingId: string;
  state: JobPostingStateSyncKnownState;
  jobPosting: JobPostingStateSyncJobPosting;
}) {
  if (current === undefined) return current;

  const filteredItems = current.filter((item) => item.job_posting_id !== jobPostingId);

  if (!state || !isJobPostingStateInListKind(state, kind)) return filteredItems;

  const nextItem = buildJobPostingStateListItem(state, jobPosting);

  return [nextItem, ...filteredItems];
}

function syncJobPostingStateCaches({ jobPostingId, state, jobPosting, userId }: { jobPostingId: string; state: JobPostingStateSyncState; jobPosting: JobPostingStateSyncJobPosting; userId: string }) {
  const detailUrl = API.PROTECTED.getJobPostingStateByJobPostingId(jobPostingId);

  if (state === undefined) {
    void mutateWithAuthKey<GetJobPostingStateResponse>(detailUrl, userId);

    for (const kind of JOB_POSTING_STATE_LIST_KINDS) {
      void mutateWithAuthKey<JobPostingStateListResponse>(API.PROTECTED.getJobPostingStateList({ kind }), userId);
    }

    return;
  }

  void mutateWithAuthKey<GetJobPostingStateResponse>(detailUrl, userId, state, {
    revalidate: false,
  });

  for (const kind of JOB_POSTING_STATE_LIST_KINDS) {
    const listUrl = API.PROTECTED.getJobPostingStateList({ kind });

    void mutateWithAuthKey<JobPostingStateListResponse>(
      listUrl,
      userId,
      (current) =>
        applyJobPostingStateToList({
          current,
          kind,
          jobPostingId,
          state,
          jobPosting,
        }),
      { revalidate: false },
    );
  }
}

function broadcastJobPostingStateSync({ phase, mutationSeq, jobPostingId, state, jobPosting, kinds, userId }: Omit<JobPostingStateSyncMessage, "originTabId" | "type">) {
  if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") return;

  const originTabId = getJobPostingStateSyncTabId();

  if (!originTabId) return;

  const channel = new window.BroadcastChannel(JOB_POSTING_STATE_SYNC_CHANNEL_NAME);

  channel.postMessage({
    type: "job-posting-state-sync",
    phase,
    mutationSeq,
    jobPostingId,
    state,
    jobPosting,
    kinds,
    originTabId,
    userId,
  } satisfies JobPostingStateSyncMessage);
  channel.close();
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
  const latestSyncMarkersByKeyRef = useRef<Map<string, JobPostingStateSyncMarker>>(new Map());

  useEffect(() => {
    if (!url || !userId) return;
    if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") return;

    const currentTabId = getJobPostingStateSyncTabId();

    if (!currentTabId) return;

    const channel = new window.BroadcastChannel(JOB_POSTING_STATE_SYNC_CHANNEL_NAME);
    const handleMessage = (event: MessageEvent<JobPostingStateSyncMessage>) => {
      const message = event.data;

      if (message?.type !== "job-posting-state-sync") return;
      if (message.userId !== userId) return;
      if (message.originTabId === currentTabId) return;
      if (message.jobPostingId !== job_posting_id) return;
      if (isStaleJobPostingStateSyncMessage(latestSyncMarkersByKeyRef.current, message)) return;

      if (message.phase === "rollback" && message.state === undefined) {
        void mutateWithAuthKey<GetJobPostingStateResponse>(url, userId);

        return;
      }

      void mutateWithAuthKey<GetJobPostingStateResponse>(url, userId, message.state ?? null, {
        revalidate: false,
      });
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [job_posting_id, url, userId]);

  return useSWRWithAuthKey<GetJobPostingStateResponse>(url, userId);
}

export function useJobPostingStateList(kind: JobPostingStateListKind, userId: ClerkAuthUserId) {
  const url = userId ? API.PROTECTED.getJobPostingStateList({ kind }) : null;
  const latestSyncMarkersByKeyRef = useRef<Map<string, JobPostingStateSyncMarker>>(new Map());

  useEffect(() => {
    if (!url || !userId) return;
    if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") return;

    const currentTabId = getJobPostingStateSyncTabId();

    if (!currentTabId) return;

    const channel = new window.BroadcastChannel(JOB_POSTING_STATE_SYNC_CHANNEL_NAME);
    const handleMessage = (event: MessageEvent<JobPostingStateSyncMessage>) => {
      const message = event.data;

      if (message?.type !== "job-posting-state-sync") return;
      if (message.userId !== userId) return;
      if (message.originTabId === currentTabId) return;
      if (!message.kinds.includes(kind)) return;
      if (isStaleJobPostingStateSyncMessage(latestSyncMarkersByKeyRef.current, message)) return;

      if (message.phase === "rollback" && message.state === undefined) {
        void mutateWithAuthKey<JobPostingStateListResponse>(url, userId);

        return;
      }

      void mutateWithAuthKey<JobPostingStateListResponse>(
        url,
        userId,
        (current) =>
          applyJobPostingStateToList({
            current,
            kind,
            jobPostingId: message.jobPostingId,
            state: message.state ?? null,
            jobPosting: message.jobPosting,
          }),
        { revalidate: false },
      );
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [kind, url, userId]);

  return useSWRWithAuthKey<JobPostingStateListResponse>(url, userId);
}

export function useUpsertJobPostingState(job_posting_id: string, userId: ClerkAuthUserId, jobPosting: JobPostingStateSyncJobPosting | null = null) {
  const url = userId ? API.PROTECTED.getJobPostingStateByJobPostingId(job_posting_id) : null;
  const { data: currentState } = useSWRWithAuthKey<GetJobPostingStateResponse>(url, userId);

  const pendingToggleActionRef = useRef<JobPostingStateToggleAction | null>(null);
  const pendingNoteActionRef = useRef<Extract<JobPostingStateAction, { action: "set_note" }> | null>(null);
  const inFlightRef = useRef<Promise<GetJobPostingStateResponse> | null>(null);
  const syncSeqRef = useRef(0);
  const visibleStateRef = useRef<JobPostingStateSyncState>(undefined);
  const chainBaseStateRef = useRef<JobPostingStateSyncState>(undefined);
  const lastSuccessfulServerStateRef = useRef<JobPostingStateSyncState>(undefined);

  useEffect(() => {
    if (currentState === undefined) return;
    if (inFlightRef.current) return;

    visibleStateRef.current = currentState;
  }, [currentState]);

  const resolveVisibleState = useCallback(() => {
    if (visibleStateRef.current !== undefined) return visibleStateRef.current;

    return currentState;
  }, [currentState]);

  const applyLocalSyncState = useCallback(
    (state: JobPostingStateSyncState) => {
      if (!userId) return;

      const authenticatedUserId = userId;

      visibleStateRef.current = state;

      if (!jobPosting) {
        if (!url) return;

        if (state === undefined) {
          void mutateWithAuthKey<GetJobPostingStateResponse>(url, authenticatedUserId);
        } else {
          void mutateWithAuthKey<GetJobPostingStateResponse>(url, authenticatedUserId, state, {
            revalidate: false,
          });
        }

        return;
      }

      syncJobPostingStateCaches({
        jobPostingId: job_posting_id,
        state,
        jobPosting,
        userId: authenticatedUserId,
      });
    },
    [jobPosting, job_posting_id, url, userId],
  );

  const broadcastSyncState = useCallback(
    (phase: JobPostingStateSyncPhase, mutationSeq: number, state: JobPostingStateSyncState) => {
      if (!userId) return;
      if (!jobPosting) return;

      const authenticatedUserId = userId;

      broadcastJobPostingStateSync({
        phase,
        mutationSeq,
        jobPostingId: job_posting_id,
        state,
        jobPosting,
        kinds: JOB_POSTING_STATE_LIST_KINDS,
        userId: authenticatedUserId,
      });
    },
    [jobPosting, job_posting_id, userId],
  );

  const queuedPut = useCallback(async (mutationUrl: string, { arg }: { arg: JobPostingStateAction }): Promise<GetJobPostingStateResponse> => {
    if (arg.action === "set_note") pendingNoteActionRef.current = arg;
    else pendingToggleActionRef.current = arg;

    if (inFlightRef.current) return inFlightRef.current;

    inFlightRef.current = (async () => {
      try {
        let lastResult: GetJobPostingStateResponse = null;

        while (pendingToggleActionRef.current || pendingNoteActionRef.current) {
          const nextToggle = pendingToggleActionRef.current;

          if (nextToggle) {
            pendingToggleActionRef.current = null;
            lastResult = await putJson<typeof nextToggle, GetJobPostingStateResponse>(mutationUrl, nextToggle);
            lastSuccessfulServerStateRef.current = lastResult;
          }

          const nextNote = pendingNoteActionRef.current;

          if (nextNote) {
            pendingNoteActionRef.current = null;
            lastResult = await putJson<typeof nextNote, GetJobPostingStateResponse>(mutationUrl, nextNote);
            lastSuccessfulServerStateRef.current = lastResult;
          }
        }

        return lastResult;
      } catch (err) {
        pendingToggleActionRef.current = null;
        pendingNoteActionRef.current = null;
        throw err;
      } finally {
        inFlightRef.current = null;
      }
    })();

    return inFlightRef.current;
  }, []);

  const { trigger, isMutating } = useSWRMutationWithAuthKey<JobPostingStateAction, GetJobPostingStateResponse>(url, userId, queuedPut);

  return {
    upsertJobPostingState: async (arg: JobPostingStateAction) => {
      if (!userId) throw new Error("Unauthorized");

      const mutationSeq = ++syncSeqRef.current;
      const visibleState = resolveVisibleState();

      if (!inFlightRef.current) {
        chainBaseStateRef.current = visibleState;
        lastSuccessfulServerStateRef.current = undefined;
      }

      const optimisticState = buildOptimisticJobPostingState({
        current: visibleState,
        action: arg,
        jobPostingId: job_posting_id,
        nowIso: new Date().toISOString(),
      });

      applyLocalSyncState(optimisticState);
      broadcastSyncState("optimistic", mutationSeq, optimisticState);

      try {
        const result = await trigger(arg, {
          populateCache: false,
          revalidate: false,
        });

        if (syncSeqRef.current !== mutationSeq) return result;

        applyLocalSyncState(result);
        broadcastSyncState("confirm", mutationSeq, result);

        return result;
      } catch (err) {
        if (syncSeqRef.current !== mutationSeq) throw err;

        const didPersistEarlierState = lastSuccessfulServerStateRef.current !== undefined;
        const fallbackState = didPersistEarlierState ? lastSuccessfulServerStateRef.current : chainBaseStateRef.current;
        const phase: JobPostingStateSyncPhase = didPersistEarlierState ? "confirm" : "rollback";

        applyLocalSyncState(fallbackState);
        broadcastSyncState(phase, mutationSeq, fallbackState);

        throw err;
      } finally {
        if (syncSeqRef.current === mutationSeq) {
          chainBaseStateRef.current = undefined;
          lastSuccessfulServerStateRef.current = undefined;
        }
      }
    },
    isUpdating: isMutating,
  };
}
