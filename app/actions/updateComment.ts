"use server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { withRateLimit } from "@/lib/withRateLimit";

const actionUpdateComment = async (key: string, { arg }: { arg: { comment_id: string; content: string } }) => {
  return await withRateLimit(async (user_id) => {
    const supabase = await createClerkSupabaseClientSsr();
    const { comment_id, content } = arg;

    const { data, error } = await supabase
      .from(DBTable.COMMENT)
      .update({ content })
      .eq("id", comment_id)
      .eq("user_id", user_id) // Ensure user can only update their own comments
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }, "UpdateComment");
};

export default actionUpdateComment;
