import { auth } from "@clerk/nextjs/server";

type DataWithUserId = {
  user_id: string;
};

export function processUserData<T extends DataWithUserId>(data: T[]): ProcessedData<T> {
  const { userId } = auth();

  const processedData = data.map((item) => ({
    ...item,
    isCurrentUserItem: item.user_id === userId,
  }));

  const hasCurrentUserItem = processedData.some((item) => item.isCurrentUserItem);

  return {
    data: processedData,
    hasCurrentUserItem,
  };
}
