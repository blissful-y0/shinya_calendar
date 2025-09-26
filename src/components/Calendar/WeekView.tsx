import React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { selectedDateState, eventsState, diaryEntriesState } from '@store/atoms';
import { getDaysInWeek, formatDate, isSameDayAs, isCurrentDay } from '@utils/calendar';
import { MdCreate } from 'react-icons/md';
import styles from './WeekView.module.scss';

const WeekView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useRecoilState(selectedDateState);
  const events = useRecoilValue(eventsState);
  const diaryEntries = useRecoilValue(diaryEntriesState);

  const weekDays = getDaysInWeek(selectedDate);
  const weekDayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const getEventsForDate = (date: Date) => {
    return events.filter(event =>
      isSameDayAs(new Date(event.date), date)
    ).sort((a, b) => {
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return 0;
    });
  };

  const hasDiaryEntry = (date: Date) => {
    return diaryEntries.some(entry =>
      isSameDayAs(new Date(entry.date), date)
    );
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getEventPosition = (event: any, dayIndex: number) => {
    if (!event.startTime) return null;

    const [hours, minutes] = event.startTime.split(':').map(Number);
    const top = (hours * 60 + minutes);

    let height = 60;
    if (event.endTime) {
      const [endHours, endMinutes] = event.endTime.split(':').map(Number);
      const duration = (endHours * 60 + endMinutes) - (hours * 60 + minutes);
      height = duration;
    }

    const left = dayIndex * (100 / 7);
    const width = 100 / 7;

    return { top, height, left, width };
  };

  return (
    <div className={styles.weekView}>
      <div className={styles.weekHeader}>
        <div className={styles.timeColumn} />
        {weekDays.map((date, index) => {
          const isSelected = isSameDayAs(date, selectedDate);
          const isToday = isCurrentDay(date);
          const hasDiary = hasDiaryEntry(date);

          return (
            <div
              key={date.toISOString()}
              className={`${styles.dayHeader}
                ${isSelected ? styles.selected : ''}
                ${isToday ? styles.today : ''}`}
              onClick={() => setSelectedDate(date)}
            >
              <div className={styles.dayName}>
                {weekDayNames[index]}
              </div>
              <div className={styles.dayNumber}>
                {date.getDate()}
              </div>
              {hasDiary && <span className={styles.diaryDot}><MdCreate /></span>}
            </div>
          );
        })}
      </div>

      <div className={styles.weekContent}>
        <div className={styles.allDayRow}>
          <div className={styles.allDayLabel}>종일</div>
          {weekDays.map((date) => {
            const dayEvents = getEventsForDate(date).filter(e => !e.startTime);
            return (
              <div key={date.toISOString()} className={styles.allDayCell}>
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={styles.allDayEvent}
                    style={{ backgroundColor: event.color }}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className={styles.timeGrid}>
          <div className={styles.hoursColumn}>
            {hours.map(hour => (
              <div key={hour} className={styles.hourLabel}>
                {formatHour(hour)}
              </div>
            ))}
          </div>

          <div className={styles.daysGrid}>
            {weekDays.map((_, index) => (
              <div key={index} className={styles.dayColumn} />
            ))}

            <div className={styles.gridLines}>
              {hours.map(hour => (
                <div key={hour} className={styles.hourLine} />
              ))}
            </div>

            <div className={styles.eventsLayer}>
              {weekDays.map((date, dayIndex) => {
                const dayEvents = getEventsForDate(date).filter(e => e.startTime);
                return dayEvents.map(event => {
                  const position = getEventPosition(event, dayIndex);
                  if (!position) return null;

                  return (
                    <div
                      key={event.id}
                      className={styles.timedEvent}
                      style={{
                        top: `${position.top}px`,
                        height: `${position.height}px`,
                        left: `${position.left}%`,
                        width: `calc(${position.width}% - 4px)`,
                        backgroundColor: event.color
                      }}
                    >
                      <div className={styles.eventTime}>
                        {event.startTime}
                      </div>
                      <div className={styles.eventTitle}>
                        {event.title}
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;