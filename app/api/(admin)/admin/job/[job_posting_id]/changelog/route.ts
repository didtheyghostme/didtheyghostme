import { NextResponse } from "next/server";

import { createClerkSupabaseClientSsr } from "@/lib/supabase";
import { checkRole } from "@/lib/clerkRoles";

export async function GET(request: Request, { params }: { params: { job_posting_id: string } }) {
  try {
    if (!checkRole("admin")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const supabase = await createClerkSupabaseClientSsr();
    const { data: changelog, error } = await supabase.from("job_posting_changelog").select("*").eq("job_posting_id", params.job_posting_id).order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(changelog);
  } catch (error) {
    console.error("Error fetching changelog:", error);

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
