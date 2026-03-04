import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";

export type GetApplicationReviewResponse = Pick<ApplicationReviewTable, "id" | "application_id" | "user_id" | "content" | "created_at" | "updated_at"> | null;

type PutApplicationReviewBody = {
  content: string;
};

export async function GET(_request: NextRequest, { params }: { params: { application_id: string } }) {
  const { userId } = auth();

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase
    .from(DBTable.APPLICATION_REVIEW)
    .select("id,application_id,user_id,content,created_at,updated_at")
    .eq("application_id", params.application_id)
    .eq("user_id", userId)
    .maybeSingle()
    .overrideTypes<GetApplicationReviewResponse, { merge: false }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? null);
}

export async function PUT(request: NextRequest, { params }: { params: { application_id: string } }) {
  const { userId } = auth();

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as PutApplicationReviewBody;

  if (!body?.content || body.content.trim().length === 0) return NextResponse.json({ error: "Content is required" }, { status: 400 });

  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase
    .from(DBTable.APPLICATION_REVIEW)
    .upsert(
      {
        application_id: params.application_id,
        user_id: userId,
        content: body.content.trim(),
      } satisfies InsertApplicationReview,
      { onConflict: "application_id" },
    )
    .select("id,application_id,user_id,content,created_at,updated_at")
    .single()
    .overrideTypes<GetApplicationReviewResponse, { merge: false }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
