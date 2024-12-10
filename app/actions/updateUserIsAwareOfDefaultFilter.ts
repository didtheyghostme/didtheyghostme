"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function updateUserIsAwareOfDefaultFilter() {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        isAwareOfDefaultFilter: true,
      },
    });
  } catch (error) {
    console.error("Failed to update isAwareOfDefaultFilter status:", error);
    throw new Error("Failed to update isAwareOfDefaultFilter status");
  }
}
