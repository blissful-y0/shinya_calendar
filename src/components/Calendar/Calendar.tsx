import React from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  currentMonthState,
  selectedDateState,
  selectedEventState,
  eventsState,
  diaryEntriesState,
  viewModeState
} from '@store/atoms';
import {
  getCalendarDays,
  formatDate,
  isCurrentMonth,
  isSameDayAs,
  isCurrentDay,
  weekDays
} from '@utils/calendar';
import { getEventsForDate as getEventsForDateUtil } from '@utils/eventUtils';
import { Event, DiaryEntry } from '@types';
import { MdCreate } from 'react-icons/md';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
import styles from './Calendar.module.scss';

const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useRecoilState(currentMonthState);
  const [selectedDate, setSelectedDate] = useRecoilState(selectedDateState);
  const setSelectedEvent = useSetRecoilState(selectedEventState);
  const events = useRecoilValue(eventsState);
  const diaryEntries = useRecoilValue(diaryEntriesState);
  const viewMode = useRecoilValue(viewModeState);

  // 디버깅: 전체 이벤트 수 로그 (한 번만)
  React.useEffect(() => {
    console.log('Total events in Calendar:', events.length);
    console.log('Google events:', events.filter(e => e.id.startsWith('google_')).length);
  }, [events.length]);

  const calendarDays = getCalendarDays(currentMonth);

  const getEventsForDate = (date: Date): Event[] => {
    // Get the range for the current view (current month + padding)
    const rangeStart = startOfMonth(addMonths(currentMonth, -1));
    const rangeEnd = endOfMonth(addMonths(currentMonth, 1));

    const result = getEventsForDateUtil(events, date, rangeStart, rangeEnd);

    // 디버깅: 특정 날짜에 이벤트가 있으면 로그 출력
    if (result.length > 0) {
      console.log(`Events for ${date.toDateString()}:`, result);
    }

    return result;
  };

  const hasDiaryEntry = (date: Date): boolean => {
    return diaryEntries.some(entry =>
      isSameDayAs(new Date(entry.date), date)
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const renderCalendarDay = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    const hasDiary = hasDiaryEntry(date);
    const isSelected = isSameDayAs(date, selectedDate);
    const isToday = isCurrentDay(date);
    const isInCurrentMonth = isCurrentMonth(date, currentMonth);

    return (
      <div
        key={date.toISOString()}
        className={`${styles.calendarDay}
          ${!isInCurrentMonth ? styles.otherMonth : ''}
          ${isSelected ? styles.selected : ''}
          ${isToday ? styles.today : ''}`}
        onClick={() => handleDateClick(date)}
      >
        <div className={styles.dayNumber}>
          {date.getDate()}
        </div>
        <div className={styles.dayContent}>
          {dayEvents.length > 0 && (
            <div className={styles.eventList}>
              {dayEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className={styles.eventItem}
                  style={{ borderLeftColor: event.color, cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(event);
                    setSelectedDate(date);
                  }}
                >
                  <span className={styles.eventTime}>
                    {event.startTime}
                  </span>
                  <span className={styles.eventTitle}>
                    {event.title}
                  </span>
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
            <div className={styles.diaryIndicator} title="일기 작성됨"><MdCreate /></div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.weekDays}>
        {weekDays.map(day => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>
      <div className={styles.calendarGrid}>
        {calendarDays.map(date => renderCalendarDay(date))}
      </div>
    </div>
  );
};

export default Calendar;