"use server";

import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { InterviewRoundSchema } from "@/lib/schema/addInterviewRoundSchema";

export type UpdateInterviewRoundsArgs = Pick<InterviewExperienceTable, "application_id"> & {
  interviewRounds: InterviewRoundSchema[];
};

const actionUpdateInterviewRounds = async (key: string, { arg }: { arg: UpdateInterviewRoundsArgs }): Promise<InterviewExperienceTable[]> => {
  const { application_id, interviewRounds } = arg;
  const supabase = await createClerkSupabaseClientSsr();
  const { userId: user_id } = auth();

  if (!user_id) {
    throw new Error("User not authenticated");
  }

  try {
    // First, get the current interview rounds for this application
    const { data: existingRounds, error: fetchError } = await supabase.from(DBTable.INTERVIEW_EXPERIENCE).select("*").eq("application_id", application_id).order("round_no", { ascending: true });

    if (fetchError) throw fetchError;

    // Prepare the rounds to be upserted
    const roundsToUpsert = interviewRounds.map((round, index) => ({
      ...round,
      round_no: index + 1,
      application_id,
      user_id,
    }));

    // Upsert the rounds
    const { data, error } = await supabase.from(DBTable.INTERVIEW_EXPERIENCE).upsert(roundsToUpsert, { onConflict: "id" }).select();

    if (error) throw error;

    // If there were more existing rounds than new rounds, delete the excess
    if (existingRounds && existingRounds.length > roundsToUpsert.length) {
      const roundsToDelete = existingRounds.slice(roundsToUpsert.length);

      await supabase
        .from(DBTable.INTERVIEW_EXPERIENCE)
        .delete()
        .in(
          "id",
          roundsToDelete.map((r) => r.id),
        );
    }

    return data;
  } catch (err) {
    console.error("Error updating interview rounds:", err);
    throw err;
  }
};

export default actionUpdateInterviewRounds;
