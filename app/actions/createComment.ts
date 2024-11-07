"use server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { ServerCreateCommentArgs } from "@/lib/hooks/useCreateComment";
import { withRateLimit } from "@/lib/withRateLimit";

const actionCreateComment = async (key: string, { arg }: { arg: ServerCreateCommentArgs }) => {
  return await withRateLimit(async (user_id) => {
    const supabase = await createClerkSupabaseClientSsr();

    const { content, entity_type, entity_id } = arg;

    const { data, error } = await supabase
      .from(DBTable.COMMENT)
      .insert({
        content,
        entity_type,
        entity_id,
        user_id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }, "CreateComment");
};

export default actionCreateComment;
