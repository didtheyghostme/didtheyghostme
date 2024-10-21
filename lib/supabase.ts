"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is undefined.");
}

export async function createClerkSupabaseClientSsr() {
  // The `useAuth()` hook is used to access the `getToken()` method
  const { getToken, userId } = auth();

  // If no userId exists, treat this as an unauthenticated/anon request
  if (!userId) {
    // Return Supabase client with the anon key for unauthenticated requests
    return createClient(supabaseUrl!, supabaseAnonKey!);
  }

  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      // Get the custom Supabase token from Clerk
      fetch: async (url, options = {}) => {
        const clerkToken = await getToken({
          template: "supabase",
        });

        // Insert the Clerk Supabase token into the headers
        const headers = new Headers(options?.headers);

        headers.set("Authorization", `Bearer ${clerkToken}`);

        // Now call the default fetch
        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
}

// You can find this in Supabase UI dashboard, go to Settings > API > Project API Keys > service_role
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function createSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase URL or Service Role Key is undefined.");
  }

  return createClient(supabaseUrl!, supabaseServiceRoleKey!);
}
