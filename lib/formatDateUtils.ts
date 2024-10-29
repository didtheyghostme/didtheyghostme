import { DateFormatter, getLocalTimeZone, parseDate } from "@internationalized/date";

export const formatDateDayMonthYear = (dateString: string, timezone = getLocalTimeZone()) => {
  const date = parseDate(dateString).toDate(timezone);

  const formatter = new DateFormatter("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return formatter.format(date);
};
