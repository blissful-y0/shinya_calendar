import { Event, RecurrenceRule } from "@types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { RRule, Frequency, rrulestr } from "rrule";

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

/**
 * 반복 규칙(RRULE)을 기반으로 반복 이벤트 인스턴스 생성
 */
export function generateRecurringEvents(
  baseEvent: Event,
  startRange: Date,
  endRange: Date
): Event[] {
  if (!baseEvent.recurrence) {
    return [baseEvent];
  }

  const events: Event[] = [];

  try {
    let rule: RRule;

    // dtstart는 UTC 날짜로 설정 (시간 정보 제거)
    const startDate = new Date(baseEvent.date);
    const utcStartDate = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate()
      )
    );

    // 구글 캘린더에서 가져온 경우: 원본 RRULE 문자열 사용
    if (baseEvent.recurrence._rrule) {
      // dtstart를 UTC 날짜로 명시적 설정
      rule = rrulestr(baseEvent.recurrence._rrule, {
        dtstart: utcStartDate,
      }) as RRule;
    } else {
      // 앱에서 직접 만든 이벤트: RecurrenceRule을 RRule로 변환
      const freqMap: Record<string, Frequency> = {
        daily: RRule.DAILY,
        weekly: RRule.WEEKLY,
        monthly: RRule.MONTHLY,
        yearly: RRule.YEARLY,
      };

      const freq = freqMap[baseEvent.recurrence.frequency];
      if (!freq) {
        console.warn("Unknown frequency:", baseEvent.recurrence.frequency);
        return [baseEvent];
      }

      const options: any = {
        freq,
        dtstart: utcStartDate,
        interval: baseEvent.recurrence.interval || 1,
      };

      if (baseEvent.recurrence.occurrences) {
        options.count = baseEvent.recurrence.occurrences;
      }

      if (baseEvent.recurrence.endDate) {
        options.until = baseEvent.recurrence.endDate;
      }

      // BYDAY: 특정 요일 지정 (예: 매주 월,수,금)
      if (
        baseEvent.recurrence.byweekday &&
        baseEvent.recurrence.byweekday.length > 0
      ) {
        options.byweekday = baseEvent.recurrence.byweekday;
      }

      // BYMONTHDAY: 월의 특정 일 지정 (예: 매월 15일)
      if (baseEvent.recurrence.bymonthday) {
        options.bymonthday = baseEvent.recurrence.bymonthday;
      }

      // BYSETPOS: n번째 발생 지정 (예: 매월 세 번째 월요일)
      if (baseEvent.recurrence.bysetpos) {
        options.bysetpos = baseEvent.recurrence.bysetpos;
      }

      rule = new RRule(options);
    }

    // 지정된 날짜 범위 내의 반복 이벤트 발생 날짜 계산
    const occurrences = rule.between(
      startRange,
      endRange,
      true // 범위의 시작일과 종료일 포함
    );

    // 여러 날에 걸친 이벤트의 날짜 차이 계산
    const daysDiff = baseEvent.endDate
      ? Math.floor(
          (baseEvent.endDate.getTime() - baseEvent.date.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    occurrences.forEach((occurrenceDate, index) => {
      // 제외된 날짜인지 확인
      const isExcluded = baseEvent.recurrence!.excludeDates?.some(
        (excludeDate) => dayjs(excludeDate).isSame(dayjs(occurrenceDate), "day")
      );

      if (!isExcluded) {
        // UTC 날짜로 저장 (타임존 이슈 방지)
        const utcDate = new Date(
          Date.UTC(
            occurrenceDate.getUTCFullYear(),
            occurrenceDate.getUTCMonth(),
            occurrenceDate.getUTCDate()
          )
        );

        const eventInstance: Event = {
          ...baseEvent,
          id: `${baseEvent.id}-${index}`,
          baseEventId: baseEvent.id,
          date: utcDate,
          endDate:
            daysDiff > 0
              ? new Date(
                  Date.UTC(
                    occurrenceDate.getUTCFullYear(),
                    occurrenceDate.getUTCMonth(),
                    occurrenceDate.getUTCDate() + daysDiff
                  )
                )
              : undefined,
        };

        events.push(eventInstance);
      }
    });

    return events;
  } catch (error) {
    console.error("반복 이벤트 생성 실패:", error, baseEvent);
    return [baseEvent]; // 실패 시 기본 이벤트 반환
  }
}

/**
 * 특정 날짜에 이벤트가 발생하는지 확인
 * 참고: 이벤트 날짜는 UTC로 저장되어 있으므로 비교 시 로컬 날짜로 변환
 */
export function isEventOnDate(event: Event, date: Date): boolean {
  // UTC 저장된 날짜를 로컬 날짜로 변환하여 비교
  const eventDate = dayjs.utc(event.date).local().startOf("day");
  const targetDate = dayjs(date).startOf("day");

  // 반복 이벤트 인스턴스인 경우 (baseEventId가 있는 경우)
  // 이미 특정 날짜에 대한 인스턴스이므로 시작일만 비교
  if (event.baseEventId) {
    return eventDate.isSame(targetDate, "day");
  }

  // 단일 날짜 이벤트
  if (!event.endDate) {
    return eventDate.isSame(targetDate, "day");
  }

  // 여러 날에 걸친 이벤트: 대상 날짜가 시작일과 종료일 사이에 있는지 확인
  const eventEndDate = dayjs.utc(event.endDate).local().startOf("day");
  return (
    targetDate.isSameOrAfter(eventDate, "day") &&
    targetDate.isSameOrBefore(eventEndDate, "day")
  );
}

/**
 * 특정 날짜의 모든 이벤트 가져오기 (반복 이벤트 포함)
 */
export function getEventsForDate(
  events: Event[],
  date: Date,
  rangeStart: Date,
  rangeEnd: Date
): Event[] {
  const eventsOnDate: Event[] = [];

  events.forEach((event) => {
    if (event.recurrence) {
      // 반복 이벤트 인스턴스 생성
      const instances = generateRecurringEvents(event, rangeStart, rangeEnd);
      instances.forEach((instance) => {
        if (isEventOnDate(instance, date)) {
          eventsOnDate.push(instance);
        }
      });
    } else {
      // 단일 이벤트 확인
      if (isEventOnDate(event, date)) {
        eventsOnDate.push(event);
      }
    }
  });

  return eventsOnDate;
}

/**
 * 이벤트 시간 표시 형식 지정
 */
export function formatEventTime(event: Event): string {
  if (event.isAllDay) {
    return "하루 종일";
  }

  if (event.startTime && event.endTime) {
    return `${event.startTime} - ${event.endTime}`;
  }

  if (event.startTime) {
    return event.startTime;
  }

  return "";
}
