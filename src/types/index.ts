export interface Event {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  color: string;
  description?: string;
  tags?: string[];
  reminder?: boolean;
}

export interface DiaryEntry {
  id: string;
  date: Date;
  title?: string;
  content: string;
  mood?: 'happy' | 'sad' | 'neutral' | 'excited' | 'tired';
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