export {};

// Create a type for the roles
export type ClerkRoles = "admin" | "moderator";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: ClerkRoles;
    };
  }

  // For public metadata - user preferences
  interface UserPublicMetadata {
    isAwareOfDefaultFilter?: boolean;
  }
}
