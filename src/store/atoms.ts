import { atom } from 'recoil';
import { Event, DiaryEntry, Theme, DDay } from '@types/index';
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
  default: defaultTheme,
  effects: [
    ({ setSelf, onSet }) => {
      // localStorage에서 저장된 테마 불러오기
      const savedTheme = localStorage.getItem('currentTheme');
      if (savedTheme) {
        try {
          const parsedTheme = JSON.parse(savedTheme);
          setSelf(parsedTheme);
        } catch (error) {
          console.error('Failed to load theme:', error);
        }
      }

      // 테마 변경 시 localStorage에 저장
      onSet((newTheme, _, isReset) => {
        if (!isReset) {
          localStorage.setItem('currentTheme', JSON.stringify(newTheme));
        }
      });
    }
  ]
});

export const customThemesState = atom<Theme[]>({
  key: 'customThemes',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      // localStorage에서 저장된 커스텀 테마 목록 불러오기
      const savedCustomThemes = localStorage.getItem('customThemes');
      if (savedCustomThemes) {
        try {
          const parsedThemes = JSON.parse(savedCustomThemes);
          setSelf(parsedThemes);
        } catch (error) {
          console.error('Failed to load custom themes:', error);
        }
      }

      // 커스텀 테마 변경 시 localStorage에 저장
      onSet((newThemes, _, isReset) => {
        if (!isReset) {
          localStorage.setItem('customThemes', JSON.stringify(newThemes));
        }
      });
    }
  ]
});

export const eventsState = atom<Event[]>({
  key: 'events',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      // localStorage에서 저장된 이벤트 목록 불러오기
      const savedEvents = localStorage.getItem('events');
      if (savedEvents) {
        try {
          const parsedEvents = JSON.parse(savedEvents);
          setSelf(parsedEvents);
        } catch (error) {
          console.error('Failed to load events:', error);
        }
      }

      // 이벤트 변경 시 localStorage에 저장
      onSet((newEvents, _, isReset) => {
        if (!isReset) {
          localStorage.setItem('events', JSON.stringify(newEvents));
        }
      });
    }
  ]
});

export const diaryEntriesState = atom<DiaryEntry[]>({
  key: 'diaryEntries',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      // localStorage에서 저장된 일기 목록 불러오기
      const savedDiaries = localStorage.getItem('diaryEntries');
      if (savedDiaries) {
        try {
          const parsedDiaries = JSON.parse(savedDiaries);
          setSelf(parsedDiaries);
        } catch (error) {
          console.error('Failed to load diary entries:', error);
        }
      }

      // 일기 변경 시 localStorage에 저장
      onSet((newDiaries, _, isReset) => {
        if (!isReset) {
          localStorage.setItem('diaryEntries', JSON.stringify(newDiaries));
        }
      });
    }
  ]
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

export const dDaysState = atom<DDay[]>({
  key: 'dDays',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      // localStorage에서 저장된 D-Day 목록 불러오기
      const savedDDays = localStorage.getItem('dDays');
      if (savedDDays) {
        try {
          const parsed = JSON.parse(savedDDays);
          // Date 객체 복원
          const restored = parsed.map((dday: any) => ({
            ...dday,
            targetDate: new Date(dday.targetDate),
            createdAt: new Date(dday.createdAt)
          }));
          setSelf(restored);
        } catch (error) {
          console.error('Failed to load D-Days:', error);
        }
      }

      // D-Day 변경 시 localStorage에 저장
      onSet((newDDays, _, isReset) => {
        if (!isReset) {
          localStorage.setItem('dDays', JSON.stringify(newDDays));
        }
      });
    }
  ]
});

export const activeDDayState = atom<DDay | null>({
  key: 'activeDDay',
  default: null,
  effects: [
    ({ setSelf, onSet }) => {
      // localStorage에서 활성 D-Day ID 불러오기
      const activeDDayId = localStorage.getItem('activeDDayId');
      if (activeDDayId) {
        const savedDDays = localStorage.getItem('dDays');
        if (savedDDays) {
          try {
            const parsed = JSON.parse(savedDDays);
            const activeDDay = parsed.find((d: any) => d.id === activeDDayId);
            if (activeDDay) {
              setSelf({
                ...activeDDay,
                targetDate: new Date(activeDDay.targetDate),
                createdAt: new Date(activeDDay.createdAt)
              });
            }
          } catch (error) {
            console.error('Failed to load active D-Day:', error);
          }
        }
      }

      // 활성 D-Day 변경 시 localStorage에 저장
      onSet((newActiveDDay, _, isReset) => {
        if (!isReset) {
          if (newActiveDDay) {
            localStorage.setItem('activeDDayId', newActiveDDay.id);
          } else {
            localStorage.removeItem('activeDDayId');
          }
        }
      });
    }
  ]
});

// 배너 이미지 상태
export const bannerImageState = atom<string | null>({
  key: 'bannerImage',
  default: null,
  effects: [
    ({ setSelf, onSet }) => {
      // localStorage에서 저장된 배너 이미지 불러오기
      const savedBanner = localStorage.getItem('bannerImage');
      if (savedBanner) {
        setSelf(savedBanner);
      }

      // 배너 이미지 변경 시 localStorage에 저장
      onSet((newBanner, _, isReset) => {
        if (!isReset) {
          if (newBanner) {
            localStorage.setItem('bannerImage', newBanner);
          } else {
            localStorage.removeItem('bannerImage');
          }
        }
      });
    }
  ]
});