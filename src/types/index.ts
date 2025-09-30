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
  reminder?: boolean;
  reminderTime?: ReminderTime; // When to send reminder
  reminderForAllOccurrences?: boolean; // Apply reminder to all recurring instances
  isAllDay?: boolean; // All-day event flag
  recurrence?: RecurrenceRule; // Recurring event settings
}

export type ReminderTime = "now" | "5min" | "10min" | "30min" | "1hour";

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number; // Every N days/weeks/months
  endDate?: Date; // When recurrence ends
  occurrences?: number; // Number of occurrences
  excludeDates?: string[]; // ISO date strings to exclude from recurrence
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
  summary: string;
  description?: string;
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
