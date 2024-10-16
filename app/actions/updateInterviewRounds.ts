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
    // Begin Transaction
    const { data: deletedData, error: deleteError } = await supabase.from(DBTable.INTERVIEW_EXPERIENCE).delete().eq("application_id", application_id).eq("user_id", user_id);

    if (deleteError) throw deleteError;

    // Prepare the rounds to be inserted
    const roundsToInsert = interviewRounds.map((round, index) => ({
      ...round,
      round_no: index + 1,
      application_id,
      user_id,
    }));

    // Insert the new rounds
    const { data, error } = await supabase.from(DBTable.INTERVIEW_EXPERIENCE).insert(roundsToInsert).select();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error("Error updating interview rounds:", err);
    throw err;
  }
};

export default actionUpdateInterviewRounds;
