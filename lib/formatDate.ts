import { DateFormatter, parseDate } from "@internationalized/date";

export const formatDate = (dateString: string) => {
  const date = parseDate(dateString).toDate("UTC");

  const formatter = new DateFormatter("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return formatter.format(date);
};
