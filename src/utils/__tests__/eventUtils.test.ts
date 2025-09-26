import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateRecurringEvents,
  isEventOnDate,
  getEventsForDate,
  formatEventTime,
} from '../eventUtils';
import { Event } from '@types';
import { addDays, addWeeks, addMonths } from 'date-fns';

describe('Event Utils', () => {
  let baseEvent: Event;
  let recurringEvent: Event;

  beforeEach(() => {
    baseEvent = {
      id: 'test-1',
      title: '테스트 이벤트',
      date: new Date('2024-01-15'),
      startTime: '10:00',
      endTime: '11:00',
      color: '#FFB6C1',
    };

    recurringEvent = {
      ...baseEvent,
      recurrence: {
        frequency: 'daily',
        interval: 1,
        endDate: new Date('2024-01-20'),
      },
    };
  });

  describe('generateRecurringEvents', () => {
    it('반복 이벤트 생성 - 매일', () => {
      const startRange = new Date('2024-01-14');
      const endRange = new Date('2024-01-21');

      const events = generateRecurringEvents(recurringEvent, startRange, endRange);

      // 15일부터 20일까지 이벤트 생성
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].date).toEqual(new Date('2024-01-15'));
      // 마지막 이벤트가 20일이거나 그 이전
      const lastEventDate = events[events.length - 1].date;
      expect(lastEventDate.getTime()).toBeLessThanOrEqual(new Date('2024-01-20').getTime());
    });

    it('반복 이벤트 생성 - 매주', () => {
      const weeklyEvent = {
        ...baseEvent,
        recurrence: {
          frequency: 'weekly' as const,
          interval: 1,
          endDate: new Date('2024-02-05'),
        },
      };

      const startRange = new Date('2024-01-01');
      const endRange = new Date('2024-02-28');

      const events = generateRecurringEvents(weeklyEvent, startRange, endRange);

      expect(events.length).toBeGreaterThan(0);
      // 각 이벤트가 일주일 간격
      if (events.length > 1) {
        const diff = events[1].date.getTime() - events[0].date.getTime();
        expect(diff).toBe(7 * 24 * 60 * 60 * 1000); // 7일
      }
    });

    it('반복 이벤트 생성 - 간격 설정', () => {
      const intervalEvent = {
        ...baseEvent,
        recurrence: {
          frequency: 'daily' as const,
          interval: 2, // 2일마다
        },
      };

      const startRange = new Date('2024-01-15');
      const endRange = new Date('2024-01-25');

      const events = generateRecurringEvents(intervalEvent, startRange, endRange);

      // 15, 17, 19, 21, 23일
      expect(events.length).toBe(5);
      expect(events[1].date).toEqual(new Date('2024-01-17'));
    });

    it('반복 없는 이벤트', () => {
      const startRange = new Date('2024-01-01');
      const endRange = new Date('2024-01-31');

      const events = generateRecurringEvents(baseEvent, startRange, endRange);

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(baseEvent);
    });
  });

  describe('isEventOnDate', () => {
    it('단일 날짜 이벤트 - 같은 날', () => {
      const date = new Date('2024-01-15');
      expect(isEventOnDate(baseEvent, date)).toBe(true);
    });

    it('단일 날짜 이벤트 - 다른 날', () => {
      const date = new Date('2024-01-16');
      expect(isEventOnDate(baseEvent, date)).toBe(false);
    });

    it('다중 날짜 이벤트 - 시작일', () => {
      const multiDayEvent = {
        ...baseEvent,
        endDate: new Date('2024-01-18'),
      };

      const date = new Date('2024-01-15');
      expect(isEventOnDate(multiDayEvent, date)).toBe(true);
    });

    it('다중 날짜 이벤트 - 중간 날짜', () => {
      const multiDayEvent = {
        ...baseEvent,
        endDate: new Date('2024-01-18'),
      };

      const date = new Date('2024-01-16');
      expect(isEventOnDate(multiDayEvent, date)).toBe(true);
    });

    it('다중 날짜 이벤트 - 종료일', () => {
      const multiDayEvent = {
        ...baseEvent,
        endDate: new Date('2024-01-18'),
      };

      const date = new Date('2024-01-18');
      expect(isEventOnDate(multiDayEvent, date)).toBe(true);
    });

    it('다중 날짜 이벤트 - 범위 밖', () => {
      const multiDayEvent = {
        ...baseEvent,
        endDate: new Date('2024-01-18'),
      };

      const date = new Date('2024-01-20');
      expect(isEventOnDate(multiDayEvent, date)).toBe(false);
    });
  });

  describe('getEventsForDate', () => {
    it('특정 날짜의 이벤트 가져오기', () => {
      const events: Event[] = [
        baseEvent,
        {
          ...baseEvent,
          id: 'test-2',
          date: new Date('2024-01-16'),
        },
      ];

      const date = new Date('2024-01-15');
      const rangeStart = new Date('2024-01-01');
      const rangeEnd = new Date('2024-01-31');

      const dayEvents = getEventsForDate(events, date, rangeStart, rangeEnd);

      expect(dayEvents).toHaveLength(1);
      expect(dayEvents[0].id).toBe('test-1');
    });

    it('반복 이벤트 포함하여 가져오기', () => {
      const events: Event[] = [recurringEvent];

      const date = new Date('2024-01-17');
      const rangeStart = new Date('2024-01-01');
      const rangeEnd = new Date('2024-01-31');

      const dayEvents = getEventsForDate(events, date, rangeStart, rangeEnd);

      expect(dayEvents).toHaveLength(1);
      expect(dayEvents[0].date).toEqual(new Date('2024-01-17'));
    });
  });

  describe('formatEventTime', () => {
    it('하루 종일 이벤트', () => {
      const allDayEvent = {
        ...baseEvent,
        isAllDay: true,
        startTime: undefined,
        endTime: undefined,
      };

      expect(formatEventTime(allDayEvent)).toBe('하루 종일');
    });

    it('시작과 종료 시간이 있는 이벤트', () => {
      expect(formatEventTime(baseEvent)).toBe('10:00 - 11:00');
    });

    it('시작 시간만 있는 이벤트', () => {
      const startOnlyEvent = {
        ...baseEvent,
        endTime: undefined,
      };

      expect(formatEventTime(startOnlyEvent)).toBe('10:00');
    });

    it('시간이 없는 이벤트', () => {
      const noTimeEvent = {
        ...baseEvent,
        startTime: undefined,
        endTime: undefined,
      };

      expect(formatEventTime(noTimeEvent)).toBe('');
    });
  });
});