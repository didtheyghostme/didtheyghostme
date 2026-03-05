import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { putApplicationReviewSchema } from "@/lib/schema/applicationReviewSchema";

export type GetApplicationReviewResponse = Pick<ApplicationReviewTable, "id" | "application_id" | "user_id" | "content" | "created_at" | "updated_at"> | null;

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

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: { application_id: string } }) {
  const { userId } = auth();

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = putApplicationReviewSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const body = parsed.data;

  const supabase = await createClerkSupabaseClientSsr();

  const { data, error } = await supabase
    .from(DBTable.APPLICATION_REVIEW)
    .upsert(
      {
        application_id: params.application_id,
        user_id: userId,
        content: body.content,
      } satisfies InsertApplicationReview,
      { onConflict: "application_id" },
    )
    .select("id,application_id,user_id,content,created_at,updated_at")
    .single()
    .overrideTypes<GetApplicationReviewResponse, { merge: false }>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
