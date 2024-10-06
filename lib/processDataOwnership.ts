import { auth } from "@clerk/nextjs/server";

export function processDataArray<T extends DataRequired>(data: T[]): ProcessedDataArray<T> {
  const { userId } = auth();

  const processedData = data.map(({ user_id, ...rest }) => ({
    ...rest,
    isCurrentUserItem: user_id === userId,
  }));

  const currentUserItem = processedData.find((item) => item.isCurrentUserItem);

  return {
    data: processedData,
    currentUserItemId: currentUserItem ? currentUserItem.id : null,
  };
}

export function processDataItem<T extends DataRequired>(data: T): ProcessedDataObject<T> {
  const { userId } = auth();

  return {
    ...data,
    isCurrentUserItem: data.user_id === userId,
  };
}
