import React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { selectedDateState, eventsState, diaryEntriesState } from '@store/atoms';
import { formatDate, isSameDayAs } from '@utils/calendar';
import { Event } from '@types/index';
import styles from './DayView.module.scss';

const DayView: React.FC = () => {
  const [selectedDate] = useRecoilState(selectedDateState);
  const events = useRecoilValue(eventsState);
  const diaryEntries = useRecoilValue(diaryEntriesState);

  const dayEvents = events.filter(event =>
    isSameDayAs(new Date(event.date), selectedDate)
  ).sort((a, b) => {
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return 0;
  });

  const hasDiary = diaryEntries.some(entry =>
    isSameDayAs(new Date(entry.date), selectedDate)
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatHour = (hour: number) => {
    const period = hour < 12 ? '오전' : '오후';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${period} ${displayHour}시`;
  };

  const getEventPosition = (event: Event) => {
    if (!event.startTime) return null;

    const [hours, minutes] = event.startTime.split(':').map(Number);
    const top = (hours * 60 + minutes) * (60 / 60); // 60px per hour

    let height = 60; // 기본 높이
    if (event.endTime) {
      const [endHours, endMinutes] = event.endTime.split(':').map(Number);
      const duration = (endHours * 60 + endMinutes) - (hours * 60 + minutes);
      height = duration * (60 / 60);
    }

    return { top, height };
  };

  return (
    <div className={styles.dayView}>
      <div className={styles.dayHeader}>
        <h2 className={styles.dateTitle}>
          {formatDate(selectedDate, 'yyyy년 M월 d일 EEEE')}
        </h2>
        {hasDiary && (
          <span className={styles.diaryIndicator}>📝 일기 작성됨</span>
        )}
      </div>

      <div className={styles.timeGrid}>
        <div className={styles.allDaySection}>
          <div className={styles.allDayLabel}>종일</div>
          <div className={styles.allDayEvents}>
            {dayEvents.filter(e => !e.startTime).map(event => (
              <div
                key={event.id}
                className={styles.allDayEvent}
                style={{ backgroundColor: event.color }}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.hourlyGrid}>
          {hours.map(hour => (
            <div key={hour} className={styles.hourRow}>
              <div className={styles.hourLabel}>
                {formatHour(hour)}
              </div>
              <div className={styles.hourContent} />
            </div>
          ))}

          <div className={styles.eventsContainer}>
            {dayEvents.filter(e => e.startTime).map(event => {
              const position = getEventPosition(event);
              if (!position) return null;

              return (
                <div
                  key={event.id}
                  className={styles.timedEvent}
                  style={{
                    top: `${position.top}px`,
                    height: `${position.height}px`,
                    backgroundColor: event.color
                  }}
                >
                  <div className={styles.eventTime}>
                    {event.startTime}
                    {event.endTime && ` - ${event.endTime}`}
                  </div>
                  <div className={styles.eventTitle}>{event.title}</div>
                  {event.description && (
                    <div className={styles.eventDescription}>{event.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayView;