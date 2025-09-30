import { atom } from 'recoil';
import { Event, DiaryEntry, Theme, DDay, GoogleCalendarSyncState } from '@types';
import { Sticker, StickerLayout, UploadedStickerTemplate } from '@components/Styling/StickerPanel';
import { startOfMonth } from 'date-fns';
import { electronStore } from '@utils/electronStore';

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
    border: '#F5E6E0',
    danger: '#FF6B6B',
    dangerLight: '#FFE0E0'
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
      border: '#E0E6F5',
      danger: '#FF6B6B',
      dangerLight: '#FFE0E0'
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
      border: '#EDE0F5',
      danger: '#FF6B6B',
      dangerLight: '#FFE0E0'
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
      border: '#E0F5EA',
      danger: '#FF6B6B',
      dangerLight: '#FFE0E0'
    }
  }
];

export const currentThemeState = atom<Theme>({
  key: 'currentTheme',
  default: defaultTheme,
  effects: [
    ({ setSelf, onSet }) => {
      // 초기화 시 Electron Store에서 저장된 테마 불러오기
      const loadTheme = async () => {
        try {
          const savedTheme = await electronStore.get('currentTheme');
          if (savedTheme && savedTheme.id && savedTheme.colors) {
            // 저장된 테마가 predefined에 있는지 확인
            const predefinedTheme = predefinedThemes.find(t => t.id === savedTheme.id);
            if (predefinedTheme) {
              setSelf(predefinedTheme);
            } else {
              // 커스텀 테마인 경우
              setSelf(savedTheme);
            }
          }
        } catch (error) {
          console.error('Failed to load theme:', error);
        }
      };

      loadTheme();

      // 테마 변경 시 Electron Store에 즉시 저장
      onSet((newTheme, _, isReset) => {
        if (!isReset && newTheme) {
          // 비동기로 저장하되 에러 처리
          electronStore.set('currentTheme', newTheme).catch(error => {
            console.error('Failed to save theme:', error);
          });
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
      // Electron Store에서 저장된 커스텀 테마 목록 불러오기
      electronStore.get('customThemes').then(savedThemes => {
        if (savedThemes) {
          setSelf(savedThemes);
        }
      }).catch(error => {
        console.error('Failed to load custom themes:', error);
      });

      // 커스텀 테마 변경 시 Electron Store에 저장
      onSet((newThemes, _, isReset) => {
        if (!isReset) {
          electronStore.set('customThemes', newThemes);
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
      // Electron Store에서 저장된 이벤트 목록 불러오기
      electronStore.get('events').then(savedEvents => {
        if (savedEvents && Array.isArray(savedEvents)) {
          // Date 문자열을 Date 객체로 변환
          const eventsWithDates = (savedEvents as any[]).map(event => ({
            ...event,
            date: new Date(event.date),
            endDate: event.endDate ? new Date(event.endDate) : undefined,
            recurrence: event.recurrence ? {
              ...event.recurrence,
              endDate: event.recurrence.endDate ? new Date(event.recurrence.endDate) : undefined
            } : undefined
          }));
          setSelf(eventsWithDates);
        }
      }).catch(error => {
        console.error('Failed to load events:', error);
      });

      // 이벤트 변경 시 Electron Store에 저장
      onSet((newEvents, _, isReset) => {
        if (!isReset) {
          electronStore.set('events', newEvents);
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
      // Electron Store에서 저장된 일기 목록 불러오기
      electronStore.get('diaryEntries').then(savedDiaries => {
        if (savedDiaries) {
          setSelf(savedDiaries);
        }
      }).catch(error => {
        console.error('Failed to load diary entries:', error);
      });

      // 일기 변경 시 Electron Store에 저장
      onSet((newDiaries, _, isReset) => {
        if (!isReset) {
          electronStore.set('diaryEntries', newDiaries);
        }
      });
    }
  ]
});

export const selectedDateState = atom<Date>({
  key: 'selectedDate',
  default: new Date()
});

export const selectedEventState = atom<Event | null>({
  key: 'selectedEvent',
  default: null
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
      // Electron Store에서 저장된 너비 불러오기
      electronStore.get('sidebarWidth').then(savedWidth => {
        if (savedWidth) {
          setSelf(savedWidth);
        }
      });

      // 너비 변경 시 Electron Store에 저장
      onSet((newWidth, _, isReset) => {
        if (!isReset && typeof newWidth === 'number') {
          electronStore.set('sidebarWidth', newWidth);
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
      // Electron Store에서 저장된 D-Day 목록 불러오기
      electronStore.get('dDays').then(savedDDays => {
        if (savedDDays) {
          // Date 객체 복원
          const restored = savedDDays.map((dday: any) => ({
            ...dday,
            targetDate: new Date(dday.targetDate),
            createdAt: new Date(dday.createdAt)
          }));
          setSelf(restored);
        }
      }).catch(error => {
        console.error('Failed to load D-Days:', error);
      });

      // D-Day 변경 시 Electron Store에 저장
      onSet((newDDays, _, isReset) => {
        if (!isReset) {
          electronStore.set('dDays', newDDays);
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
      // Electron Store에서 활성 D-Day 불러오기
      electronStore.get('activeDDay').then(savedActiveDDay => {
        if (savedActiveDDay) {
          setSelf({
            ...savedActiveDDay,
            targetDate: new Date(savedActiveDDay.targetDate),
            createdAt: new Date(savedActiveDDay.createdAt)
          });
        }
      }).catch(error => {
        console.error('Failed to load active D-Day:', error);
      });

      // 활성 D-Day 변경 시 Electron Store에 저장
      onSet((newActiveDDay, _, isReset) => {
        if (!isReset) {
          if (newActiveDDay) {
            electronStore.set('activeDDay', newActiveDDay);
          } else {
            electronStore.delete('activeDDay');
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
    ({ setSelf, onSet, trigger }) => {
      // 초기 로드 시에만 Electron Store에서 불러오기
      if (trigger === 'get') {
        electronStore.get('bannerImage').then(savedBanner => {
          if (savedBanner !== undefined) {
            setSelf(savedBanner);
          }
        }).catch(error => {
          console.error('Failed to load banner image:', error);
        });
      }

      // 배너 이미지 변경 시 Electron Store에 저장
      onSet((newBanner, _, isReset) => {
        if (!isReset) {
          if (newBanner) {
            electronStore.set('bannerImage', newBanner);
          } else {
            electronStore.delete('bannerImage');
          }
        }
      });
    }
  ]
});

// 스티커 상태
export const stickersState = atom<Sticker[]>({
  key: 'stickers',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      // Electron Store에서 저장된 스티커 목록 불러오기
      electronStore.get('stickers').then(savedStickers => {
        if (savedStickers) {
          setSelf(savedStickers);
        }
      }).catch(error => {
        console.error('Failed to load stickers:', error);
      });

      // 스티커 변경 시 Electron Store에 저장
      onSet((newStickers, _, isReset) => {
        if (!isReset) {
          electronStore.set('stickers', newStickers);
        }
      });
    }
  ]
});

// 스티커 편집 모드 상태
export const stickerEditModeState = atom<boolean>({
  key: 'stickerEditMode',
  default: false
});

// 스티커 표시/숨김 상태
export const stickerVisibilityState = atom<boolean>({
  key: 'stickerVisibility',
  default: true,
  effects: [
    ({ setSelf, onSet }) => {
      // Electron Store에서 저장된 값 불러오기
      electronStore.get('stickerVisibility').then(savedValue => {
        if (savedValue !== null && savedValue !== undefined) {
          setSelf(savedValue);
        }
      }).catch(error => {
        console.error('Failed to load sticker visibility:', error);
      });

      // 값 변경 시 Electron Store에 저장
      onSet((newValue, _, isReset) => {
        if (!isReset) {
          electronStore.set('stickerVisibility', newValue);
        }
      });
    }
  ]
});

// 모달 활성화 상태 (모달이 열려있을 때 스티커 숨기기용)
export const modalActiveState = atom<boolean>({
  key: 'modalActive',
  default: false
});

// 업로드된 스티커 템플릿들
export const uploadedStickersState = atom<UploadedStickerTemplate[]>({
  key: 'uploadedStickers',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      electronStore.get('uploadedStickers').then(savedTemplates => {
        if (savedTemplates) {
          setSelf(savedTemplates);
        }
      }).catch(error => {
        console.error('Failed to load uploaded stickers:', error);
      });

      onSet((newTemplates, _, isReset) => {
        if (!isReset) {
          electronStore.set('uploadedStickers', newTemplates);
        }
      });
    }
  ]
});

// 해상도별 스티커 레이아웃들
export const stickerLayoutsState = atom<StickerLayout[]>({
  key: 'stickerLayouts',
  default: [],
  effects: [
    ({ setSelf, onSet }) => {
      electronStore.get('stickerLayouts').then(savedLayouts => {
        if (savedLayouts) {
          const restored = savedLayouts.map((layout: any) => ({
            ...layout,
            savedAt: new Date(layout.savedAt)
          }));
          setSelf(restored);
        }
      }).catch(error => {
        console.error('Failed to load sticker layouts:', error);
      });

      onSet((newLayouts, _, isReset) => {
        if (!isReset) {
          electronStore.set('stickerLayouts', newLayouts);
        }
      });
    }
  ]
});

// Google Calendar 동기화 상태
export const googleCalendarSyncState = atom<GoogleCalendarSyncState>({
  key: 'googleCalendarSync',
  default: {
    isConnected: false,
    autoSync: false,
  },
  effects: [
    ({ setSelf, onSet }) => {
      electronStore.get('googleCalendarSyncState').then(savedState => {
        if (savedState) {
          const restored = {
            ...savedState,
            lastSyncTime: savedState.lastSyncTime ? new Date(savedState.lastSyncTime) : undefined
          };
          setSelf(restored);
        }
      }).catch(error => {
        console.error('Failed to load Google Calendar sync state:', error);
      });

      onSet((newState, _, isReset) => {
        if (!isReset) {
          electronStore.set('googleCalendarSyncState', newState);
        }
      });
    }
  ]
});