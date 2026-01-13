"use server";

import { checkRole } from "@/lib/clerkRoles";
import { syncReadmeSgInternTechVerifiedJobs } from "@/lib/readme-sync/syncReadmeSgInternTech";

export type SyncReadmeActionResult = { ok: true; didChange: boolean; exportedCount: number; commitMessage?: string } | { ok: false; error: string };

export async function syncReadmeSgInternTechAction(): Promise<SyncReadmeActionResult> {
  const isAdmin = await checkRole("admin");

  if (!isAdmin) return { ok: false, error: "Unauthorized" };

  try {
    const result = await syncReadmeSgInternTechVerifiedJobs();

    return { ok: true, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    return { ok: false, error: message };
  }
}
