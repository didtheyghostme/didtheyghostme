import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { buildSelectString, SelectObject } from "@/lib/buildSelectString";
import { ERROR_CODES, ERROR_MESSAGES } from "@/lib/errorHandling";
import { processDataOwnershipObject } from "@/lib/processDataOwnership";

type QuestionCommonData = Pick<CommentTable, "id" | "content" | "created_at" | "entity_id"> & JoinedUser;

type QuestionPageSelectData = QuestionCommonData & Pick<CommentTable, "user_id">;

export type QuestionPageRequest = QuestionCommonData & {
  isCurrentUserItem: boolean;
};

export async function GET(request: Request, { params }: { params: { comment_id: string } }) {
  const supabase = await createClerkSupabaseClientSsr();

  const selectObject: SelectObject<QuestionPageSelectData> = {
    id: true,
    content: true,
    created_at: true,
    entity_id: true,
    user_id: true,
    [DBTable.USER_DATA]: {
      full_name: true,
      profile_pic_url: true,
    },
  };

  const selectString = buildSelectString(selectObject);

  const { data, error } = await supabase.from(DBTable.COMMENT).select(selectString).eq("id", params.comment_id).maybeSingle().overrideTypes<QuestionPageSelectData, { merge: false }>();

  if (error) {
    if (error.code === ERROR_CODES.INVALID_TEXT_REPRESENTATION) {
      return NextResponse.json({ error: ERROR_MESSAGES.NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const processedData = processDataOwnershipObject(data);

  return NextResponse.json(processedData);
}
