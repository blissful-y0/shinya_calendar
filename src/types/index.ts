export interface Event {
  id: string;
  baseEventId?: string; // Original event ID for recurring instances
  title: string;
  date: Date; // Start date for multi-day events
  endDate?: Date; // End date for multi-day events
  startTime?: string;
  endTime?: string;
  color: string;
  description?: string;
  tags?: string[];
  categoryId?: string; // Category/Calendar ID
  reminder?: boolean;
  reminderTime?: ReminderTime; // When to send reminder
  reminderForAllOccurrences?: boolean; // Apply reminder to all recurring instances
  isAllDay?: boolean; // All-day event flag
  recurrence?: RecurrenceRule; // Recurring event settings
  googleEventId?: string; // 구글 캘린더 이벤트 ID (동기화용)
  googleCalendarId?: string; // 구글 캘린더 ID (동기화용)
}

export type ReminderTime = "now" | "5min" | "10min" | "30min" | "1hour";

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number; // Every N days/weeks/months
  endDate?: Date; // When recurrence ends
  occurrences?: number; // Number of occurrences
  excludeDates?: string[]; // ISO date strings to exclude from recurrence
  byweekday?: number[]; // BYDAY: 0=Monday, 1=Tuesday, ..., 6=Sunday (RRule format)
  bymonthday?: number; // BYMONTHDAY: day of month (1-31)
  bysetpos?: number; // BYSETPOS: nth occurrence (-1 for last)
  _rrule?: string; // 원본 RRULE 문자열 (구글 캘린더 호환용)
}

export interface DiaryEntry {
  id: string;
  date: Date;
  title?: string;
  content: string;
  mood?: "happy" | "sad" | "neutral" | "excited" | "tired";
  tags?: string[];
  attachments?: string[];
  weather?: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    danger: string;
    dangerLight: string;
  };
}

export interface CalendarDate {
  date: Date;
  events: Event[];
  hasDiary: boolean;
}

export interface DDay {
  id: string;
  title: string;
  description?: string;
  targetDate: Date;
  isActive: boolean;
  createdAt: Date;
}

// 구글 캘린더 연동
export type GoogleCalendarAuth = {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
};

export type GoogleCalendarSyncState = {
  isConnected: boolean;
  userEmail?: string;
  lastSyncTime?: Date;
  autoSync: boolean;
};

export type GoogleCalendarEvent = {
  id: string;
  originalEventId?: string; // 원본 구글 이벤트 ID (캘린더 ID 접두사 제거)
  summary: string;
  description?: string;
  calendarId?: string; // 출처 구글 캘린더 ID
  calendarName?: string; // 출처 구글 캘린더 이름
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  recurrence?: string[];
};

export interface TodoItem {
  id: string;
  date: Date;
  content: string;
  completed: boolean;
  important: boolean;
  createdAt: Date;
}

export interface MemoEntry {
  id: string;
  date: Date;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// 카테고리 (로컬 캘린더)
export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  isDefault?: boolean; // 기본 카테고리 여부
  googleCalendarId?: string; // 구글 캘린더와 동기화된 경우 ID 저장
  accessRole?: string; // 구글 캘린더 접근 권한 (owner, writer, reader)
  createdInApp?: boolean; // 앱에서 직접 생성한 캘린더인지 여부 (false/undefined면 공유받은 캘린더)
  createdAt: Date;
  updatedAt: Date;
}
