import { describe, it, expect } from 'vitest';
import {
  formatDate,
  getCalendarDays,
  getDaysInWeek,
  isSameDayAs,
  isCurrentDay,
  getNextMonth,
  getPreviousMonth,
  isCurrentMonth,
} from '../calendar';

describe('Calendar Utils', () => {
  describe('formatDate', () => {
    it('기본 날짜 포맷팅', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('사용자 정의 포맷 적용', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date, 'yyyy년 M월 d일')).toBe('2024년 1월 15일');
    });
  });

  describe('getCalendarDays', () => {
    it('캘린더 뷰의 모든 날짜 반환', () => {
      const date = new Date('2024-01-15');
      const days = getCalendarDays(date);

      // 캘린더는 주 단위로 표시되므로 최소 28일 이상
      expect(days.length).toBeGreaterThanOrEqual(28);
      expect(days.length).toBeLessThanOrEqual(42);
    });

    it('첫 날은 일요일', () => {
      const date = new Date('2024-01-15');
      const days = getCalendarDays(date);
      expect(days[0].getDay()).toBe(0); // 일요일
    });
  });

  describe('getDaysInWeek', () => {
    it('주간 날짜 반환 (일요일 시작)', () => {
      const date = new Date('2024-01-15'); // 월요일
      const weekDays = getDaysInWeek(date);

      expect(weekDays).toHaveLength(7);
      expect(weekDays[0].getDay()).toBe(0); // 일요일
      expect(weekDays[6].getDay()).toBe(6); // 토요일
    });
  });

  describe('isSameDayAs', () => {
    it('같은 날짜 비교', () => {
      const date1 = new Date('2024-01-15 10:00');
      const date2 = new Date('2024-01-15 20:00');
      expect(isSameDayAs(date1, date2)).toBe(true);
    });

    it('다른 날짜 비교', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');
      expect(isSameDayAs(date1, date2)).toBe(false);
    });
  });

  describe('isCurrentDay', () => {
    it('오늘 날짜 확인', () => {
      const today = new Date();
      expect(isCurrentDay(today)).toBe(true);
    });

    it('다른 날짜 확인', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isCurrentDay(yesterday)).toBe(false);
    });
  });

  describe('getNextMonth', () => {
    it('다음 달 계산', () => {
      const date = new Date('2024-01-15');
      const nextMonth = getNextMonth(date);
      expect(nextMonth.getMonth()).toBe(1); // 2월 (0부터 시작)
    });

    it('연도 넘어가는 경우', () => {
      const date = new Date('2024-12-15');
      const nextMonth = getNextMonth(date);
      expect(nextMonth.getFullYear()).toBe(2025);
      expect(nextMonth.getMonth()).toBe(0); // 1월
    });
  });

  describe('getPreviousMonth', () => {
    it('이전 달 계산', () => {
      const date = new Date('2024-02-15');
      const prevMonth = getPreviousMonth(date);
      expect(prevMonth.getMonth()).toBe(0); // 1월
    });

    it('연도 넘어가는 경우', () => {
      const date = new Date('2024-01-15');
      const prevMonth = getPreviousMonth(date);
      expect(prevMonth.getFullYear()).toBe(2023);
      expect(prevMonth.getMonth()).toBe(11); // 12월
    });
  });

  describe('isCurrentMonth', () => {
    it('같은 달 확인', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-20');
      expect(isCurrentMonth(date1, date2)).toBe(true);
    });

    it('다른 달 확인', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-02-15');
      expect(isCurrentMonth(date1, date2)).toBe(false);
    });
  });
});