import { auth } from "@clerk/nextjs/server";

export function processUserData<T extends User>(data: T[]): ProcessedData<T> {
  const { userId } = auth();

  const processedData = data.map(({ user_id, ...rest }) => ({
    ...rest,
    isCurrentUserItem: user_id === userId,
  }));

  const hasCurrentUserItem = processedData.some((item) => item.isCurrentUserItem);

  return {
    data: processedData,
    hasCurrentUserItem,
  };
}
