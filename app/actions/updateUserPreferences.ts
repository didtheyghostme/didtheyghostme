"use server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DB_RPC } from "@/lib/constants/apiRoutes";
import { withRateLimit } from "@/lib/withRateLimit";
import { UpdateUserPreferenceFormValues } from "@/lib/schema/updateUserPreferenceSchema";

const actionUpdateUserPreferences = async (key: string, { arg }: { arg: UpdateUserPreferenceFormValues }) => {
  return await withRateLimit(async (user_id) => {
    const { default_countries, default_job_categories, default_experience_levels, insert_default_countries, insert_default_job_categories, insert_default_experience_levels } = arg;

    const supabase = await createClerkSupabaseClientSsr();

    try {
      const { error } = await supabase.rpc(DB_RPC.UPDATE_USER_PREFERENCES, {
        p_user_id: user_id,

        p_default_countries: default_countries,
        p_default_job_categories: default_job_categories,
        p_default_experience_levels: default_experience_levels,

        p_insert_default_countries: insert_default_countries,
        p_insert_default_job_categories: insert_default_job_categories,
        p_insert_default_experience_levels: insert_default_experience_levels,
      });

      if (error) throw error;
    } catch (err) {
      console.error("Error executing RPC update user preferences:", err);
      throw err;
    }
  }, "UpdateUserPreferences");
};

export default actionUpdateUserPreferences;
