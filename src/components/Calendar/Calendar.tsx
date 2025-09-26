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
            <div className={styles.eventIndicators}>
              {dayEvents.slice(0, 3).map((event, idx) => (
                <div
                  key={event.id}
                  className={styles.eventDot}
                  style={{ backgroundColor: event.color }}
                />
              ))}
              {dayEvents.length > 3 && (
                <span className={styles.moreEvents}>+{dayEvents.length - 3}</span>
              )}
            </div>
          )}
          {hasDiary && (
            <div className={styles.diaryIndicator} />
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