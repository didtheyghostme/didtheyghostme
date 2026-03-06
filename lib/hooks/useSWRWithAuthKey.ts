import useSWR, { mutate, MutatorCallback, MutatorOptions, SWRConfiguration } from "swr";
import useSWRMutation, { SWRMutationConfiguration } from "swr/mutation";

import { fetcher } from "@/lib/fetcher";

export const ANON_USER_ID = "anonymous"; // Sentinel value for anonymous users - more descriptive than null/undefined

export type ClerkAuthUserId = string | null | undefined;

type AuthDependentKey = readonly [RequestInfo, ClerkAuthUserId];
type AuthDependentMutationKey = readonly [string, string];

/**
 * Fetcher function that extracts the URL from the cache key tuple
 * and ignores the userId (which is only used for cache invalidation)
 */
export const authDependentFetcher = async <T = any>([url, _userId]: AuthDependentKey): Promise<T> => {
  return fetcher(url);
};

/**
 * SWR hook that includes auth state in the cache key
 *
 * @param url - The API endpoint to fetch data from
 * @param userId - The current user's ID (will use {@link ANON_USER_ID} if not authenticated)
 * @param options - Standard SWR configuration options
 * @returns SWR response with data, error, and other SWR properties
 *
 * @example
 * // In a component:
 * const { userId } = useAuth();
 * const { data, error } = useSWRWithAuthKey('/api/user-data', userId);
 */
export const useSWRWithAuthKey = <T>(url: RequestInfo | null | undefined, userId: ClerkAuthUserId, options?: SWRConfiguration<T>) => {
  // Create a stable cache key that changes when auth state changes.
  // Use the sentinel value for anonymous users to ensure consistency.
  // If userId is undefined, it means the user is anonymous.
  const swrKey: AuthDependentKey | null = url ? ([url, userId ?? ANON_USER_ID] as const) : null;

  return useSWR<T>(swrKey, authDependentFetcher, options);
};

/**
 * SWR mutation hook that includes auth state in the cache key
 *
 * @param url - The API endpoint for the mutation
 * @param userId - The current user's ID (will use {@link ANON_USER_ID} if not authenticated)
 * @param mutationFn - The mutation function to execute
 * @param options - Standard SWR mutation configuration options
 * @returns SWR mutation response with trigger, isMutating, and other SWR mutation properties
 *
 * @example
 * // In a component:
 * const { userId } = useAuth();
 * const { trigger, isMutating } = useSWRMutationWithAuthKey(
 *   '/api/create-item',
 *   userId,
 *   createItemAction
 * );
 */
export const useSWRMutationWithAuthKey = <TArg, TResult, TError = Error>(
  url: string | null | undefined,
  userId: ClerkAuthUserId,
  mutationFn: (url: string, opts: { arg: TArg }) => Promise<TResult>,
  options?: SWRMutationConfiguration<TResult, TError, AuthDependentMutationKey, TArg>,
) => {
  const swrKey: AuthDependentMutationKey | null = url ? ([url, userId ?? ANON_USER_ID] as const) : null;

  return useSWRMutation(swrKey, async ([url]: AuthDependentMutationKey, opts: { arg: TArg }) => mutationFn(url, opts), options);
};

/**
 * Mutate function that uses the same cache key format as {@link useSWRWithAuthKey}
 * @param url - The API endpoint to invalidate
 * @param userId - The current user's ID (will use {@link ANON_USER_ID} if not authenticated)
 */
export function mutateWithAuthKey<Data = any>(url: string, userId: ClerkAuthUserId): Promise<Data | undefined>;
export function mutateWithAuthKey<Data = any>(
  url: string,
  userId: ClerkAuthUserId,
  data: Data | Promise<Data> | MutatorCallback<Data>,
  options?: boolean | MutatorOptions<Data>,
): Promise<Data | undefined>;
export function mutateWithAuthKey<Data = any>(url: string, userId: ClerkAuthUserId, data?: Data | Promise<Data> | MutatorCallback<Data>, options?: boolean | MutatorOptions<Data>) {
  const key = [url, userId ?? ANON_USER_ID] as const;

  if (arguments.length === 2) return mutate<Data>(key);

  return mutate<Data>(key, data as Data | Promise<Data> | MutatorCallback<Data>, options);
}
