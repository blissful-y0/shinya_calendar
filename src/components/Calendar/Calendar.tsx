import {
  currentMonthState,
  diaryEntriesState,
  eventsState,
  selectedDateState,
  selectedEventState,
  viewModeState,
} from "@store/atoms";
import { Event } from "@types";
import {
  getCalendarDays,
  isCurrentDay,
  isCurrentMonth,
  isSameDayAs,
  weekDays,
} from "@utils/calendar";
import { generateRecurringEvents, isEventOnDate } from "@utils/eventUtils";
import dayjs from "dayjs";
import React from "react";
import { MdCreate } from "react-icons/md";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import styles from "./Calendar.module.scss";

// CalendarDay 컴포넌트를 메모이제이션
const CalendarDay = React.memo(
  ({
    date,
    dayEvents,
    hasDiary,
    isSelected,
    isToday,
    isInCurrentMonth,
    onDateClick,
    onEventClick,
  }: {
    date: Date;
    dayEvents: Event[];
    hasDiary: boolean;
    isSelected: boolean;
    isToday: boolean;
    isInCurrentMonth: boolean;
    onDateClick: (date: Date) => void;
    onEventClick: (event: Event, date: Date) => void;
  }) => {
    return (
      <div
        key={date.toISOString()}
        className={`${styles.calendarDay}
        ${!isInCurrentMonth ? styles.otherMonth : ""}
        ${isSelected ? styles.selected : ""}
        ${isToday ? styles.today : ""}`}
        onClick={() => onDateClick(date)}
      >
        <div className={styles.dayNumber}>{date.getDate()}</div>
        <div className={styles.dayContent}>
          {dayEvents.length > 0 && (
            <div className={styles.eventList}>
              {dayEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className={styles.eventItem}
                  style={{ borderLeftColor: event.color, cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event, date);
                  }}
                >
                  <span className={styles.eventTime}>{event.startTime}</span>
                  <span className={styles.eventTitle}>{event.title}</span>
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className={styles.moreEvents}>
                  +{dayEvents.length - 2}개 더
                </div>
              )}
            </div>
          )}
          {hasDiary && (
            <div className={styles.diaryIndicator} title="일기 작성됨">
              <MdCreate />
            </div>
          )}
        </div>
      </div>
    );
  }
);

const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useRecoilState(currentMonthState);
  const [selectedDate, setSelectedDate] = useRecoilState(selectedDateState);
  const setSelectedEvent = useSetRecoilState(selectedEventState);
  const events = useRecoilValue(eventsState);
  const diaryEntries = useRecoilValue(diaryEntriesState);
  const viewMode = useRecoilValue(viewModeState);

  const calendarDays = React.useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth]
  );

  // 반복 이벤트를 포함한 모든 이벤트를 한 번만 생성 (메모이제이션)
  const expandedEvents = React.useMemo(() => {
    const rangeStart = dayjs(currentMonth)
      .subtract(1, "month")
      .startOf("month")
      .toDate();
    const rangeEnd = dayjs(currentMonth)
      .add(1, "month")
      .endOf("month")
      .toDate();

    const allEvents: Event[] = [];

    events.forEach((event) => {
      if (event.recurrence) {
        // 반복 이벤트 확장
        const instances = generateRecurringEvents(event, rangeStart, rangeEnd);
        allEvents.push(...instances);
      } else {
        // 단일 이벤트
        allEvents.push(event);
      }
    });

    return allEvents;
  }, [events, currentMonth]);

  const getEventsForDate = React.useCallback(
    (date: Date): Event[] => {
      // 이미 확장된 이벤트 목록에서 필터링
      const filtered = expandedEvents.filter((event) =>
        isEventOnDate(event, date)
      );

      // 시간순으로 정렬: 종일 이벤트 → 시간 이벤트 (시간순)
      return filtered.sort((a, b) => {
        // 종일 이벤트는 맨 앞으로
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        if (a.isAllDay && b.isAllDay) return 0;

        // 시간이 있는 이벤트는 시간순으로 정렬
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }

        // 시작 시간이 없는 이벤트는 뒤로
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;

        return 0;
      });
    },
    [expandedEvents]
  );

  const hasDiaryEntry = React.useCallback(
    (date: Date): boolean => {
      return diaryEntries.some((entry) =>
        isSameDayAs(new Date(entry.date), date)
      );
    },
    [diaryEntries]
  );

  const handleDateClick = React.useCallback(
    (date: Date) => {
      setSelectedDate(date);
    },
    [setSelectedDate]
  );

  const handleEventClick = React.useCallback(
    (event: Event, date: Date) => {
      setSelectedEvent(event);
      setSelectedDate(date);
    },
    [setSelectedEvent, setSelectedDate]
  );

  return (
    <div className={styles.calendar}>
      <div className={styles.weekDays}>
        {weekDays.map((day) => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>
      <div className={styles.calendarGrid}>
        {calendarDays.map((date) => (
          <CalendarDay
            key={date.toISOString()}
            date={date}
            dayEvents={getEventsForDate(date)}
            hasDiary={hasDiaryEntry(date)}
            isSelected={isSameDayAs(date, selectedDate)}
            isToday={isCurrentDay(date)}
            isInCurrentMonth={isCurrentMonth(date, currentMonth)}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        ))}
      </div>
    </div>
  );
};

export default Calendar;
