import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths
} from 'date-fns';
import { ko } from 'date-fns/locale';

export const getCalendarDays = (date: Date) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
};

export const getDaysInWeek = (date: Date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: weekStart, end: weekEnd });
};

export const formatDate = (date: Date, formatStr: string = 'yyyy-MM-dd') => {
  return format(date, formatStr, { locale: ko });
};

export const isCurrentMonth = (date: Date, currentMonth: Date) => {
  return isSameMonth(date, currentMonth);
};

export const isSameDayAs = (date1: Date, date2: Date) => {
  return isSameDay(date1, date2);
};

export const isCurrentDay = (date: Date) => {
  return isToday(date);
};

export const getNextMonth = (date: Date) => {
  return addMonths(date, 1);
};

export const getPreviousMonth = (date: Date) => {
  return subMonths(date, 1);
};

export const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
export const weekDaysEnglish = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const monthNames = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월'
];
export const monthNamesEnglish = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];