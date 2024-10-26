import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";

export type QuestionPageRequest = Pick<CommentTable, "id" | "content" | "created_at" | "entity_id"> & {
  [DBTable.USER_DATA]: ClerkUserProfileData;
};

export async function GET(request: Request, { params }: { params: { comment_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<QuestionPageRequest> = {
    id: true,
    content: true,
    created_at: true,
    entity_id: true,
    [DBTable.USER_DATA]: {
      full_name: true,
      profile_pic_url: true,
    },
  };

  const selectString = buildSelectString(selectObject);

  const { data, error } = await supabase.from(DBTable.COMMENT).select(selectString).eq("id", params.comment_id).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
