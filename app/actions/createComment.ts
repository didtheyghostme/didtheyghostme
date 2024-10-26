"use server";

import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { ServerCreateCommentArgs } from "@/lib/hooks/useCreateComment";

const actionCreateComment = async (key: string, { arg }: { arg: ServerCreateCommentArgs }) => {
  const supabase = await createClerkSupabaseClientSsr();
  const { userId } = auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { content, entity_type, entity_id } = arg;

  const { data, error } = await supabase
    .from(DBTable.COMMENT)
    .insert({
      content,
      entity_type,
      entity_id,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export default actionCreateComment;
