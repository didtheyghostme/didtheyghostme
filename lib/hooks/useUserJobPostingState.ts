import type { JobPostingStateAction } from "@/lib/schema/jobPostingStateActionSchema";

import { useEffect, useRef } from "react";

import { GetJobPostingStateResponse } from "@/app/api/(protected)/job-posting-state/[job_posting_id]/route";
import { API } from "@/lib/constants/apiRoutes";
import { ClerkAuthUserId, mutateWithAuthKey, useSWRWithAuthKey } from "@/lib/hooks/useSWRWithAuthKey";

type JobPostingStateListKind = "to_apply" | "skipped" | "notes";
type JobPostingStateToggleAction = Exclude<JobPostingStateAction, { action: "set_note" }>;
type JobPostingStateNoteAction = Extract<JobPostingStateAction, { action: "set_note" }>;

const JOB_POSTING_STATE_SYNC_CHANNEL_NAME = "job-posting-state-sync";
const JOB_POSTING_STATE_TOGGLE_SYNC_KINDS = ["to_apply", "skipped"] as const satisfies readonly JobPostingStateListKind[];
const JOB_POSTING_STATE_NOTE_SYNC_KINDS = ["notes"] as const satisfies readonly JobPostingStateListKind[];
const JOB_POSTING_STATE_SYNC_PHASE_RANK: Record<JobPostingStateSyncPhase, number> = {
  optimistic: 1,
  confirmed: 2,
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
type JobPostingStateCacheState = GetJobPostingStateResponse | undefined;
type JobPostingStateKnownState = Exclude<JobPostingStateCacheState, undefined>;
type JobPostingStateListJobPosting = JobPostingStateListItem["job_posting"];
type JobPostingStateSyncPhase = "optimistic" | "confirmed" | "rollback";
type JobPostingStateSyncMessage = {
  type: "job-posting-state-sync";
  phase: JobPostingStateSyncPhase;
  kinds: readonly JobPostingStateListKind[];
  mutationSeq: number;
  originId: string;
  sentAtMs: number;
  jobPostingId: string;
  state: GetJobPostingStateResponse;
  jobPosting: JobPostingStateListJobPosting;
  userId: string;
};
type JobPostingStateInvalidationMessage = {
  type: "job-posting-state-invalidated";
  kinds: readonly JobPostingStateListKind[];
  originId: string;
  jobPostingId: string;
  userId: string;
};
type JobPostingStateChannelMessage = JobPostingStateSyncMessage | JobPostingStateInvalidationMessage;
type JobPostingStateSyncMarker = Pick<JobPostingStateSyncMessage, "originId" | "sentAtMs" | "mutationSeq" | "phase">;

let cachedJobPostingStateSyncOriginId: string | null = null;

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

function getJobPostingStateSyncOriginId() {
  if (cachedJobPostingStateSyncOriginId) return cachedJobPostingStateSyncOriginId;
  if (typeof window === "undefined") return null;

  const nextOriginId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

  cachedJobPostingStateSyncOriginId = nextOriginId;

  return nextOriginId;
}

function createJobPostingStateChannel() {
  if (typeof BroadcastChannel === "undefined") return null;

  return new BroadcastChannel(JOB_POSTING_STATE_SYNC_CHANNEL_NAME);
}

function compareJobPostingStateSyncMarkers(
  left: Pick<JobPostingStateSyncMarker, "originId" | "sentAtMs" | "mutationSeq">,
  right: Pick<JobPostingStateSyncMarker, "originId" | "sentAtMs" | "mutationSeq">,
) {
  if (left.sentAtMs !== right.sentAtMs) return left.sentAtMs - right.sentAtMs;

  const originIdOrder = left.originId.localeCompare(right.originId);

  if (originIdOrder !== 0) return originIdOrder;

  return left.mutationSeq - right.mutationSeq;
}

function shouldApplyJobPostingStateSyncMessage(latestSyncMarkersByJobPostingId: Map<string, JobPostingStateSyncMarker>, message: JobPostingStateSyncMessage) {
  const currentMarker = latestSyncMarkersByJobPostingId.get(message.jobPostingId);
  const nextMarker: JobPostingStateSyncMarker = {
    originId: message.originId,
    sentAtMs: message.sentAtMs,
    mutationSeq: message.mutationSeq,
    phase: message.phase,
  };

  if (!currentMarker) {
    latestSyncMarkersByJobPostingId.set(message.jobPostingId, nextMarker);

    return true;
  }

  const mutationOrder = compareJobPostingStateSyncMarkers(nextMarker, currentMarker);

  if (mutationOrder < 0) return false;
  if (mutationOrder === 0 && JOB_POSTING_STATE_SYNC_PHASE_RANK[message.phase] <= JOB_POSTING_STATE_SYNC_PHASE_RANK[currentMarker.phase]) return false;

  latestSyncMarkersByJobPostingId.set(message.jobPostingId, nextMarker);

  return true;
}

function isJobPostingStateInListKind(state: JobPostingStateKnownState, kind: JobPostingStateListKind) {
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

function buildJobPostingStateListItem(state: NonNullable<JobPostingStateKnownState>, jobPosting: JobPostingStateListJobPosting): JobPostingStateListItem {
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
  state: GetJobPostingStateResponse;
  jobPosting: JobPostingStateListJobPosting;
}) {
  if (current === undefined) return current;

  const filteredItems = current.filter((item) => item.job_posting_id !== jobPostingId);

  if (!state || !isJobPostingStateInListKind(state, kind)) return filteredItems;

  const nextItem = buildJobPostingStateListItem(state, jobPosting);

  return [nextItem, ...filteredItems];
}

function applyJobPostingStateToDetailCache({ jobPostingId, state, userId }: { jobPostingId: string; state: JobPostingStateCacheState; userId: string }) {
  const detailUrl = API.PROTECTED.getJobPostingStateByJobPostingId(jobPostingId);

  if (state === undefined) {
    void mutateWithAuthKey<GetJobPostingStateResponse>(detailUrl, userId);

    return;
  }

  void mutateWithAuthKey<GetJobPostingStateResponse>(detailUrl, userId, state, {
    revalidate: false,
  });
}

function applyJobPostingStateToListCaches({
  jobPostingId,
  state,
  jobPosting,
  kinds,
  userId,
}: {
  jobPostingId: string;
  state: JobPostingStateCacheState;
  jobPosting: JobPostingStateListJobPosting;
  kinds: readonly JobPostingStateListKind[];
  userId: string;
}) {
  if (state === undefined) {
    for (const kind of kinds) {
      void mutateWithAuthKey<JobPostingStateListResponse>(API.PROTECTED.getJobPostingStateList({ kind }), userId);
    }

    return;
  }

  for (const kind of kinds) {
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

function applyStateToCaches({
  jobPostingId,
  state,
  jobPosting,
  kinds,
  userId,
}: {
  jobPostingId: string;
  state: JobPostingStateCacheState;
  jobPosting: JobPostingStateListJobPosting | null;
  kinds: readonly JobPostingStateListKind[];
  userId: string;
}) {
  applyJobPostingStateToDetailCache({
    jobPostingId,
    state,
    userId,
  });

  if (!jobPosting) return;

  applyJobPostingStateToListCaches({
    jobPostingId,
    state,
    jobPosting,
    kinds,
    userId,
  });
}

function broadcastJobPostingStateSync({ phase, mutationSeq, sentAtMs, jobPostingId, state, jobPosting, kinds, userId }: Omit<JobPostingStateSyncMessage, "originId" | "type">) {
  const originId = getJobPostingStateSyncOriginId();
  const channel = createJobPostingStateChannel();

  if (!originId || !channel) return;

  channel.postMessage({
    type: "job-posting-state-sync",
    phase,
    mutationSeq,
    originId,
    sentAtMs,
    jobPostingId,
    state,
    jobPosting,
    kinds,
    userId,
  } satisfies JobPostingStateSyncMessage);
  channel.close();
}

function broadcastJobPostingStateInvalidation({ jobPostingId, kinds, userId }: Omit<JobPostingStateInvalidationMessage, "originId" | "type">) {
  const originId = getJobPostingStateSyncOriginId();
  const channel = createJobPostingStateChannel();

  if (!originId || !channel) return;

  channel.postMessage({
    type: "job-posting-state-invalidated",
    kinds,
    originId,
    jobPostingId,
    userId,
  } satisfies JobPostingStateInvalidationMessage);
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
  const latestSyncMarkersByJobPostingIdRef = useRef<Map<string, JobPostingStateSyncMarker>>(new Map());

  useEffect(() => {
    if (!url || !userId) return;

    const currentOriginId = getJobPostingStateSyncOriginId();
    const channel = createJobPostingStateChannel();

    if (!currentOriginId || !channel) return;
    const handleMessage = (event: MessageEvent<JobPostingStateChannelMessage>) => {
      const message = event.data;

      if (!message) return;
      if (message.userId !== userId) return;
      if (message.originId === currentOriginId) return;
      if (message.jobPostingId !== job_posting_id) return;

      if (message.type === "job-posting-state-invalidated") {
        void mutateWithAuthKey<GetJobPostingStateResponse>(url, userId);

        return;
      }

      if (!shouldApplyJobPostingStateSyncMessage(latestSyncMarkersByJobPostingIdRef.current, message)) return;

      void mutateWithAuthKey<GetJobPostingStateResponse>(url, userId, message.state, {
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
  const latestSyncMarkersByJobPostingIdRef = useRef<Map<string, JobPostingStateSyncMarker>>(new Map());

  useEffect(() => {
    if (!url || !userId) return;

    const currentOriginId = getJobPostingStateSyncOriginId();
    const channel = createJobPostingStateChannel();

    if (!currentOriginId || !channel) return;
    const handleMessage = (event: MessageEvent<JobPostingStateChannelMessage>) => {
      const message = event.data;

      if (!message) return;
      if (message.userId !== userId) return;
      if (message.originId === currentOriginId) return;
      if (!message.kinds.includes(kind)) return;

      if (message.type === "job-posting-state-invalidated") {
        void mutateWithAuthKey<JobPostingStateListResponse>(url, userId);

        return;
      }

      if (!shouldApplyJobPostingStateSyncMessage(latestSyncMarkersByJobPostingIdRef.current, message)) return;

      void mutateWithAuthKey<JobPostingStateListResponse>(
        url,
        userId,
        (current) =>
          applyJobPostingStateToList({
            current,
            kind,
            jobPostingId: message.jobPostingId,
            state: message.state,
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

export function useUpsertJobPostingState(job_posting_id: string, userId: ClerkAuthUserId, jobPosting: JobPostingStateListJobPosting | null = null) {
  const url = userId ? API.PROTECTED.getJobPostingStateByJobPostingId(job_posting_id) : null;
  const { data: currentState } = useSWRWithAuthKey<GetJobPostingStateResponse>(url, userId);

  const pendingToggleActionRef = useRef<JobPostingStateToggleAction | null>(null);
  const pendingNoteActionRef = useRef<JobPostingStateNoteAction | null>(null);
  const inFlightRef = useRef<Promise<GetJobPostingStateResponse> | null>(null);
  const toggleMutationSeqRef = useRef(0);
  const broadcastMutationSeqRef = useRef(0);
  const visibleStateRef = useRef<JobPostingStateCacheState>(undefined);
  const toggleBaseStateRef = useRef<JobPostingStateCacheState>(undefined);
  const lastSuccessfulServerStateRef = useRef<JobPostingStateCacheState>(undefined);

  useEffect(() => {
    if (currentState === undefined) return;
    if (inFlightRef.current) return;

    visibleStateRef.current = currentState;
  }, [currentState]);

  function resolveVisibleState() {
    if (visibleStateRef.current !== undefined) return visibleStateRef.current;

    return currentState;
  }

  function applyStateToLocalCaches(state: JobPostingStateCacheState, kinds: readonly JobPostingStateListKind[]) {
    if (!userId) return;

    visibleStateRef.current = state;

    applyStateToCaches({
      jobPostingId: job_posting_id,
      state,
      jobPosting,
      kinds,
      userId,
    });
  }

  function broadcastStateSync(phase: JobPostingStateSyncPhase, mutationSeq: number, sentAtMs: number, state: GetJobPostingStateResponse, kinds: readonly JobPostingStateListKind[]) {
    if (!userId || !jobPosting) return;

    broadcastJobPostingStateSync({
      phase,
      mutationSeq,
      sentAtMs,
      jobPostingId: job_posting_id,
      state,
      jobPosting,
      kinds,
      userId,
    });
  }

  function broadcastStateInvalidation(kinds: readonly JobPostingStateListKind[]) {
    if (!userId) return;

    broadcastJobPostingStateInvalidation({
      jobPostingId: job_posting_id,
      kinds,
      userId,
    });
  }

  async function runQueuedMutation(action: JobPostingStateAction) {
    if (!url) throw new Error("Unauthorized");

    if (action.action === "set_note") pendingNoteActionRef.current = action;
    else pendingToggleActionRef.current = action;

    if (inFlightRef.current) return inFlightRef.current;

    inFlightRef.current = (async () => {
      try {
        let lastResult: GetJobPostingStateResponse = null;

        while (pendingToggleActionRef.current || pendingNoteActionRef.current) {
          const nextToggle = pendingToggleActionRef.current;

          if (nextToggle) {
            pendingToggleActionRef.current = null;
            lastResult = await putJson<typeof nextToggle, GetJobPostingStateResponse>(url, nextToggle);
            lastSuccessfulServerStateRef.current = lastResult;
          }

          const nextNote = pendingNoteActionRef.current;

          if (nextNote) {
            pendingNoteActionRef.current = null;
            lastResult = await putJson<typeof nextNote, GetJobPostingStateResponse>(url, nextNote);
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
  }

  async function upsertJobPostingState(action: JobPostingStateToggleAction) {
    if (!userId) throw new Error("Unauthorized");

    const startedNewMutationChain = !inFlightRef.current;
    const visibleState = resolveVisibleState();
    const mutationSeq = ++toggleMutationSeqRef.current;
    const broadcastMutationSeq = ++broadcastMutationSeqRef.current;
    const sentAtMs = Date.now();
    const optimisticState = buildOptimisticJobPostingState({
      current: visibleState,
      action,
      jobPostingId: job_posting_id,
      nowIso: new Date().toISOString(),
    });

    if (startedNewMutationChain) lastSuccessfulServerStateRef.current = undefined;
    if (toggleBaseStateRef.current === undefined) toggleBaseStateRef.current = visibleState;

    applyStateToLocalCaches(optimisticState, JOB_POSTING_STATE_TOGGLE_SYNC_KINDS);
    broadcastStateSync("optimistic", broadcastMutationSeq, sentAtMs, optimisticState, JOB_POSTING_STATE_TOGGLE_SYNC_KINDS);

    try {
      const result = await runQueuedMutation(action);

      if (toggleMutationSeqRef.current !== mutationSeq) return result;

      applyStateToLocalCaches(result, JOB_POSTING_STATE_TOGGLE_SYNC_KINDS);
      broadcastStateSync("confirmed", broadcastMutationSeq, sentAtMs, result, JOB_POSTING_STATE_TOGGLE_SYNC_KINDS);

      return result;
    } catch (err) {
      if (toggleMutationSeqRef.current !== mutationSeq) throw err;

      const fallbackState = lastSuccessfulServerStateRef.current !== undefined ? lastSuccessfulServerStateRef.current : toggleBaseStateRef.current;

      applyStateToLocalCaches(fallbackState, JOB_POSTING_STATE_TOGGLE_SYNC_KINDS);

      if (fallbackState === undefined) broadcastStateInvalidation(JOB_POSTING_STATE_TOGGLE_SYNC_KINDS);
      else broadcastStateSync("rollback", broadcastMutationSeq, sentAtMs, fallbackState, JOB_POSTING_STATE_TOGGLE_SYNC_KINDS);

      throw err;
    } finally {
      if (toggleMutationSeqRef.current === mutationSeq) {
        toggleBaseStateRef.current = undefined;
        lastSuccessfulServerStateRef.current = undefined;
      }
    }
  }

  async function saveJobPostingStateNote(note: JobPostingStateNoteAction["note"]) {
    if (!userId) throw new Error("Unauthorized");

    const startedNewMutationChain = !inFlightRef.current;

    if (startedNewMutationChain) {
      lastSuccessfulServerStateRef.current = undefined;
      toggleBaseStateRef.current = undefined;
    }

    const result = await runQueuedMutation({
      action: "set_note",
      note,
    });

    applyStateToLocalCaches(result, JOB_POSTING_STATE_NOTE_SYNC_KINDS);

    broadcastStateSync("confirmed", ++broadcastMutationSeqRef.current, Date.now(), result, JOB_POSTING_STATE_NOTE_SYNC_KINDS);

    return result;
  }

  return {
    upsertJobPostingState,
    saveJobPostingStateNote,
  };
}
