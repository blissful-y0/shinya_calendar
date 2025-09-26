import React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  currentMonthState,
  selectedDateState,
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
import { Event, DiaryEntry } from '@types/index';
import styles from './Calendar.module.scss';

const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useRecoilState(currentMonthState);
  const [selectedDate, setSelectedDate] = useRecoilState(selectedDateState);
  const events = useRecoilValue(eventsState);
  const diaryEntries = useRecoilValue(diaryEntriesState);
  const viewMode = useRecoilValue(viewModeState);

  const calendarDays = getCalendarDays(currentMonth);

  const getEventsForDate = (date: Date): Event[] => {
    return events.filter(event =>
      isSameDayAs(new Date(event.date), date)
    );
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
                  style={{ borderLeftColor: event.color }}
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
            <div className={styles.diaryIndicator} title="일기 작성됨">📝</div>
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