import { auth } from "@clerk/nextjs/server";

type DataRequired = {
  id: string;
  user_id: string;
};

export function processUserData<T extends DataRequired>(data: T[]): ProcessedData<T> {
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
