import { NextResponse } from "next/server";

import { checkRole } from "@/lib/clerkRoles";
import { createClerkSupabaseClientSsr } from "@/lib/supabase";

export async function GET() {
  try {
    if (!checkRole("admin")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const supabase = await createClerkSupabaseClientSsr();
    const { data: jobs, error } = await supabase.from("job_posting").select("*").order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
