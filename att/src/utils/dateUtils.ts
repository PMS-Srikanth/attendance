import { format, parse, isAfter, isBefore, isSameDay, addDays, startOfDay } from 'date-fns';

export const formatDate = (date: Date | string, formatStr: string = 'yyyy-MM-dd'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

export const parseDate = (dateString: string, formatStr: string = 'yyyy-MM-dd'): Date => {
  return parse(dateString, formatStr, new Date());
};

export const isDateInPast = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = startOfDay(new Date());
  return isBefore(startOfDay(dateObj), today);
};

export const isDateToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isSameDay(dateObj, new Date());
};

export const isDateInFuture = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = startOfDay(new Date());
  // Include today as "future" - predictions should include current day until midnight
  return isAfter(startOfDay(dateObj), today) || isSameDay(startOfDay(dateObj), today);
};

export const getDayOfWeek = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'EEEE');
};

export const generateDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (isBefore(currentDate, end) || isSameDay(currentDate, end)) {
    dates.push(formatDate(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
};

export const isWeekend = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = dateObj.getDay();
  return day === 0; // Only Sunday is weekend, Saturday can be working day
};

export const getWeekNumber = (date: Date | string): number => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
  const days = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};
