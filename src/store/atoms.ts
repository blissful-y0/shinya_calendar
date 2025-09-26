import { atom } from 'recoil';
import { Event, DiaryEntry, Theme } from '@types/index';
import { startOfMonth } from 'date-fns';

export const defaultTheme: Theme = {
  id: 'pastel-pink',
  name: 'Pastel Pink',
  colors: {
    primary: '#FFB6C1',
    secondary: '#FFC0CB',
    accent: '#FFE4E1',
    background: '#FFF8F5',
    surface: '#FFFFFF',
    text: '#4A4A4A',
    textSecondary: '#8B8B8B',
    border: '#F5E6E0'
  }
};

export const predefinedThemes: Theme[] = [
  defaultTheme,
  {
    id: 'pastel-blue',
    name: 'Pastel Blue',
    colors: {
      primary: '#B6D7FF',
      secondary: '#C0D9FF',
      accent: '#E1EDFF',
      background: '#F5F8FF',
      surface: '#FFFFFF',
      text: '#4A4A4A',
      textSecondary: '#8B8B8B',
      border: '#E0E6F5'
    }
  },
  {
    id: 'pastel-lavender',
    name: 'Pastel Lavender',
    colors: {
      primary: '#DCC9E8',
      secondary: '#E6D7F1',
      accent: '#F0E6F6',
      background: '#FAF8FC',
      surface: '#FFFFFF',
      text: '#4A4A4A',
      textSecondary: '#8B8B8B',
      border: '#EDE0F5'
    }
  },
  {
    id: 'pastel-mint',
    name: 'Pastel Mint',
    colors: {
      primary: '#B8E6D3',
      secondary: '#C8EDD9',
      accent: '#E1F5ED',
      background: '#F5FBF8',
      surface: '#FFFFFF',
      text: '#4A4A4A',
      textSecondary: '#8B8B8B',
      border: '#E0F5EA'
    }
  }
];

export const currentThemeState = atom<Theme>({
  key: 'currentTheme',
  default: defaultTheme
});

export const customThemesState = atom<Theme[]>({
  key: 'customThemes',
  default: []
});

export const eventsState = atom<Event[]>({
  key: 'events',
  default: []
});

export const diaryEntriesState = atom<DiaryEntry[]>({
  key: 'diaryEntries',
  default: []
});

export const selectedDateState = atom<Date>({
  key: 'selectedDate',
  default: new Date()
});

export const currentMonthState = atom<Date>({
  key: 'currentMonth',
  default: startOfMonth(new Date())
});

export const sidebarOpenState = atom<boolean>({
  key: 'sidebarOpen',
  default: true
});

export const sidebarWidthState = atom<number>({
  key: 'sidebarWidth',
  default: 320, // 기본 너비 (px)
  effects: [
    ({ setSelf, onSet }) => {
      // localStorage에서 저장된 너비 불러오기
      const savedWidth = localStorage.getItem('sidebarWidth');
      if (savedWidth) {
        setSelf(parseInt(savedWidth));
      }

      // 너비 변경 시 localStorage에 저장
      onSet((newWidth, _, isReset) => {
        if (!isReset && typeof newWidth === 'number') {
          localStorage.setItem('sidebarWidth', newWidth.toString());
        }
      });
    }
  ]
});

export const viewModeState = atom<'month' | 'week' | 'day'>({
  key: 'viewMode',
  default: 'month'
});