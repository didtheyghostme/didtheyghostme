import { DateFormatter, getLocalTimeZone, parseDate, today } from "@internationalized/date";

export const formatDateDayMonthYear = (dateString: string, timezone = getLocalTimeZone()) => {
  const date = parseDate(dateString).toDate(timezone);

  const formatter = new DateFormatter("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return formatter.format(date);
};

export function isRecentDate(dateString: string, days = 7): boolean {
  const date = parseDate(dateString);

  const todayDate = today("UTC"); // use UTC to avoid timezone issues

  const pastDate = todayDate.subtract({ days });

  // Check if the date is between pastDate (inclusive) and today
  return date.compare(pastDate) >= 0;
}
