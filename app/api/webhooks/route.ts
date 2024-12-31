import { Webhook } from "svix";
import { headers } from "next/headers";
import { UserWebhookEvent, WebhookEvent } from "@clerk/nextjs/server";

import { createSupabaseAdminClient } from "@/lib/supabase";
import { DBTable } from "@/lib/constants/dbTables";
import { mp } from "@/lib/mixpanelServer";

function getPrimaryOrFirstEmail(evt: UserWebhookEvent): string | null {
  // Only handle user.created and user.updated events
  // user.deleted events have different data structure (DeletedObjectJSON)
  if (evt.type === "user.deleted") return null;

  const { email_addresses, primary_email_address_id } = evt.data;

  // If no email addresses exist, return null instead of throwing error
  if (!email_addresses?.length) {
    return null;
  }

  // If primary email is set, try to find it
  if (primary_email_address_id) {
    const primaryEmail = email_addresses.find((email) => email.id === primary_email_address_id);

    if (primaryEmail) {
      return primaryEmail.email_address;
    }
  }

  // Fallback to first email if no primary email is set or found
  return email_addresses[0].email_address;
}

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
    const userEmail = getPrimaryOrFirstEmail(evt);
    const userFullName = `${evt.data.first_name} ${evt.data.last_name}`;
    const userGithub = evt.data.external_accounts.find((account) => account.provider === "oauth_github")?.username;

    const isNewUser = evt.type === "user.created";
    const timestamp = new Date().toISOString();

    mp.people.set(userId, {
      $email: userEmail,
      $name: userFullName,
      github: userGithub,
      clerk_id: userId,
      ...(isNewUser ? { signup_date: timestamp } : { update_date: timestamp }),
    });

    const event_name = isNewUser ? "User Signed Up" : "User Profile Updated";

    mp.track(event_name, {
      distinct_id: userId,
      clerk_id: userId,
      email: userEmail,
      github: userGithub,
      name: userFullName,
      source: "Clerk Webhook",
      ...(isNewUser ? { signup_date: timestamp } : { update_date: timestamp }),
    });

    // Supabase create/update user data
    const supabase = await createSupabaseAdminClient();

    // Upsert user data into Supabase
    const { error } = await supabase.from(DBTable.USER_DATA).upsert(
      {
        user_id: userId,
        full_name: userFullName,
        profile_pic_url: evt.data.image_url,
        email: userEmail,
      },
      {
        onConflict: "user_id", // This specifies which column to check for conflicts
      },
    );

    if (error) {
      console.error("Error upserting user:", error);

      return new Response("Error creating/updating user in database", { status: 500 });
    }

    return new Response("User created/updated successfully", { status: 200 });
  }

  return new Response("", { status: 200 });
}
