export const fetcher = async <T = any>(resource: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(resource, init);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: T = await response.json();

  return data;
};
