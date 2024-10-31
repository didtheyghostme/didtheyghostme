import { auth } from "@clerk/nextjs/server";

import { ClerkRoles } from "@/types/globals";

export const checkRole = async (role: ClerkRoles) => {
  const { sessionClaims } = await auth();

  return sessionClaims?.metadata.role === role;
};
