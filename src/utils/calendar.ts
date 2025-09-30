import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import "dayjs/locale/ko";

dayjs.extend(weekday);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("ko");

export const getCalendarDays = (date: Date) => {
  const monthStart = dayjs(date).startOf("month");
  const monthEnd = dayjs(date).endOf("month");

  // 일요일(0)부터 시작하는 주
  const calendarStart = monthStart.day(0);
  const calendarEnd = monthEnd.day(6);

  const days: Date[] = [];
  let current = calendarStart;

  while (current.isSameOrBefore(calendarEnd, "day")) {
    days.push(current.toDate());
    current = current.add(1, "day");
  }

  return days;
};

export const getDaysInWeek = (date: Date) => {
  const weekStart = dayjs(date).day(0); // 일요일
  const weekEnd = dayjs(date).day(6); // 토요일

  const days: Date[] = [];
  let current = weekStart;

  while (current.isSameOrBefore(weekEnd, "day")) {
    days.push(current.toDate());
    current = current.add(1, "day");
  }

  return days;
};

export const formatDate = (
  date: Date,
  formatStr: string = "YYYY년 MM월 DD일 dddd"
) => {
  return dayjs(date).format(formatStr);
};

export const isCurrentMonth = (date: Date, currentMonth: Date) => {
  return dayjs(date).isSame(dayjs(currentMonth), "month");
};

export const isSameDayAs = (date1: Date, date2: Date) => {
  return dayjs(date1).isSame(dayjs(date2), "day");
};

export const isCurrentDay = (date: Date) => {
  return dayjs(date).isSame(dayjs(), "day");
};

export const getNextMonth = (date: Date) => {
  return dayjs(date).add(1, "month").toDate();
};

export const getPreviousMonth = (date: Date) => {
  return dayjs(date).subtract(1, "month").toDate();
};

export const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
export const weekDaysEnglish = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];
export const monthNames = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];
export const monthNamesEnglish = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
