import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";

import { createSupabaseAdminClient } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { mixpanel } from "@/lib/mixpanel-server";

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);

    return new Response("Error occured", {
      status: 400,
    });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    // mixpanel tracking server side

    const userId = evt.data.id;
    const isNewUser = evt.type === "user.created";
    const timestamp = new Date().toISOString();

    mixpanel.people.set(userId, {
      $email: evt.data.email_addresses[0]?.email_address,
      $github: evt.data.external_accounts.find((account) => account.provider === "oauth_github")?.username,
      $name: `${evt.data.first_name} ${evt.data.last_name}`,
      clerk_id: userId,
      ...(isNewUser ? { signup_date: timestamp } : { update_date: timestamp }),
    });

    const event_name = isNewUser ? "User Signed Up" : "User Profile Updated";

    mixpanel.track(event_name, {
      distinct_id: userId,
      clerk_id: userId,
      $email: evt.data.email_addresses[0]?.email_address,
      $github: evt.data.external_accounts.find((account) => account.provider === "oauth_github")?.username,
      $name: `${evt.data.first_name} ${evt.data.last_name}`,
      source: "Clerk Webhook",
      ...(isNewUser ? { signup_date: timestamp } : { update_date: timestamp }),
    });

    // Supabase create/update user data
    const supabase = await createSupabaseAdminClient();

    console.log("user.updated userId:", userId);

    // Upsert user data into Supabase
    const { error } = await supabase.from(DBTable.USER_DATA).upsert(
      {
        user_id: userId,
        full_name: `${evt.data.first_name} ${evt.data.last_name}`,
        profile_pic_url: evt.data.image_url,
      },
      {
        onConflict: "user_id", // This specifies which column to check for conflicts
      },
    );

    if (error) {
      console.error("Error upserting user into Supabase:", error);

      return new Response("Error creating/updating user in database", { status: 500 });
    }

    return new Response("User created/updated successfully", { status: 200 });
  }

  return new Response("", { status: 200 });
}
