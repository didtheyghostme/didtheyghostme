"use server";

import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DB_RPC } from "@/lib/constants/apiRoutes";
import { InterviewExperienceFormValues } from "@/lib/schema/updateInterviewRoundSchema";

const actionUpdateApplicationAndInterviewRounds = async (key: string, { arg }: { arg: InterviewExperienceFormValues & { application_id: string } }) => {
  const { application_id, applied_date, first_response_date, status, interviewRounds } = arg;
  const supabase = await createClerkSupabaseClientSsr();
  const { userId: user_id } = auth();

  if (!user_id) {
    throw new Error("User not authenticated");
  }

  try {
    const { error } = await supabase.rpc(DB_RPC.UPDATE_APPLICATION_AND_INTERVIEW_ROUNDS, {
      p_user_id: user_id,
      p_application_id: application_id,
      p_applied_date: applied_date,
      p_first_response_date: first_response_date,
      p_status: status,
      p_interview_rounds: interviewRounds,
    });

    if (error) throw error;
  } catch (err) {
    console.error("Error updating action application and interview rounds:", err);
    throw err;
  }
};

export default actionUpdateApplicationAndInterviewRounds;
