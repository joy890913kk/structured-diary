import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from "date-fns";

export function formatDate(date: Date, pattern = "yyyy-MM-dd") {
  return format(date, pattern);
}

export function getMonthRange(date: Date) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getCalendarDays(date: Date, weekStartsOn: 0 | 1 = 0) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const start = startOfWeek(monthStart, { weekStartsOn });
  const end = endOfWeek(monthEnd, { weekStartsOn });

  const days: Date[] = [];
  let current = start;
  while (current <= end) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}
