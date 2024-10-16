"use server";

import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { InterviewRoundSchema } from "@/lib/schema/addInterviewRoundSchema";
import { DB_RPC } from "@/lib/constants/apiRoutes";

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
    const { data, error } = await supabase.rpc(DB_RPC.UPDATE_INTERVIEW_ROUNDS, {
      p_user_id: user_id,
      p_application_id: application_id,
      p_interview_rounds: interviewRounds,
    });

    if (error) throw error;

    return data;
  } catch (err) {
    console.error("Error updating interview rounds:", err);
    throw err;
  }
};

export default actionUpdateInterviewRounds;
