import { DateFormatter, getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { format, formatDistanceToNowStrict } from "date-fns";

const formatToYYYYMMDD = (dateString: string) => {
  return format(new Date(dateString), "yyyy-MM-dd");
};

export const formatDateDayMonthYear = (dateString: string, timezone = getLocalTimeZone()) => {
  const formattedDate = dateString.includes("T") ? formatToYYYYMMDD(dateString) : dateString;

  const date = parseDate(formattedDate).toDate(timezone);

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

export function formatHowLongAgo(date: Date | string | number) {
  return formatDistanceToNowStrict(new Date(date), {
    addSuffix: true,
  });
}
