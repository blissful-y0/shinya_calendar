import { describe, it, expect } from 'vitest';
import {
  formatDate,
  getDaysInMonth,
  getDaysInWeek,
  isSameDayAs,
  isCurrentDay,
  getNextMonth,
  getPreviousMonth,
  getWeekNumber,
} from '../calendar';

describe('Calendar Utils', () => {
  describe('formatDate', () => {
    it('기본 날짜 포맷팅', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('2024년 1월 15일');
    });

    it('사용자 정의 포맷 적용', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-01-15');
    });
  });

  describe('getDaysInMonth', () => {
    it('한 달의 모든 날짜 반환', () => {
      const date = new Date('2024-01');
      const days = getDaysInMonth(date);

      // 1월은 31일까지 있음
      expect(days).toHaveLength(31);
      expect(days[0].getDate()).toBe(1);
      expect(days[30].getDate()).toBe(31);
    });

    it('윤년 2월 처리', () => {
      const date = new Date('2024-02'); // 2024년은 윤년
      const days = getDaysInMonth(date);
      expect(days).toHaveLength(29);
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

  describe('getWeekNumber', () => {
    it('주차 번호 계산', () => {
      const date = new Date('2024-01-01'); // 첫 주
      expect(getWeekNumber(date)).toBe(1);
    });

    it('연중 주차 계산', () => {
      const date = new Date('2024-07-15'); // 연중
      const weekNum = getWeekNumber(date);
      expect(weekNum).toBeGreaterThan(0);
      expect(weekNum).toBeLessThanOrEqual(53);
    });
  });
});