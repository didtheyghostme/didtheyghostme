"use server";

import { clerkClient } from "@clerk/nextjs/server";

import { checkRole } from "@/lib/clerkRoles";

export async function setRole(formData: FormData) {
  // Check that the user trying to set the role is an admin
  if (!checkRole("admin")) {
    return { message: "Not Authorized" };
  }

  try {
    const res = await clerkClient().users.updateUser(formData.get("id") as string, {
      publicMetadata: { role: formData.get("role") },
    });

    return { message: res.publicMetadata };
  } catch (err) {
    return { message: err };
  }
}

export async function removeRole(formData: FormData) {
  try {
    const res = await clerkClient().users.updateUser(formData.get("id") as string, {
      publicMetadata: { role: null },
    });

    return { message: res.publicMetadata };
  } catch (err) {
    return { message: err };
  }
}
