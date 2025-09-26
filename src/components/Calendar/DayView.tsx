import React from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { selectedDateState, selectedEventState, eventsState, diaryEntriesState } from '@store/atoms';
import { formatDate, isSameDayAs } from '@utils/calendar';
import { getEventsForDate } from '@utils/eventUtils';
import { Event } from '@types';
import { startOfMonth, endOfMonth, addMonths, startOfDay, endOfDay, isBefore, isAfter, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MdCreate } from 'react-icons/md';
import styles from './DayView.module.scss';

const DayView: React.FC = () => {
  const [selectedDate] = useRecoilState(selectedDateState);
  const setSelectedEvent = useSetRecoilState(selectedEventState);
  const events = useRecoilValue(eventsState);
  const diaryEntries = useRecoilValue(diaryEntriesState);

  // 반복 이벤트를 포함하여 선택된 날짜의 이벤트 가져오기
  const rangeStart = startOfMonth(addMonths(selectedDate, -1));
  const rangeEnd = endOfMonth(addMonths(selectedDate, 1));
  const dayEvents = getEventsForDate(events, selectedDate, rangeStart, rangeEnd)
    .sort((a, b) => {
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
    // Multi-day 이벤트 처리
    if (event.endDate && event.date !== event.endDate) {
      const currentDayStart = startOfDay(selectedDate);
      const currentDayEnd = endOfDay(selectedDate);
      const eventStart = new Date(event.date);
      const eventEnd = new Date(event.endDate);

      // 이벤트가 현재 날짜를 포함하는지 확인
      const startsBeforeToday = isBefore(eventStart, currentDayStart);
      const endsAfterToday = isAfter(eventEnd, currentDayEnd);

      // 하루 전체를 차지하는지 확인
      const isFullDayForToday = (startsBeforeToday || !event.startTime ||
        (event.startTime && event.startTime === '00:00')) &&
        (endsAfterToday || !event.endTime ||
        (event.endTime && event.endTime === '23:59'));

      if (isFullDayForToday) {
        // 이 날짜에서는 종일 이벤트로 처리
        return null; // 타임 그리드에는 표시하지 않음
      }

      // 시작 시간 계산
      let top = 0;
      if (!startsBeforeToday && event.startTime) {
        const [hours, minutes] = event.startTime.split(':').map(Number);
        top = (hours * 60 + minutes) * (80 / 60); // 80px per hour
      }

      // 높이 계산
      let height = 1920; // 전체 24시간 (24 * 80px)
      if (!startsBeforeToday && !endsAfterToday && event.startTime && event.endTime) {
        // 오늘 시작하고 오늘 끝나는 경우
        const [startHours, startMinutes] = event.startTime.split(':').map(Number);
        const [endHours, endMinutes] = event.endTime.split(':').map(Number);
        const duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        height = duration * (80 / 60);
      } else if (!startsBeforeToday && event.startTime) {
        // 오늘 시작하지만 다른 날에 끝나는 경우
        const [startHours, startMinutes] = event.startTime.split(':').map(Number);
        height = (1440 - (startHours * 60 + startMinutes)) * (80 / 60);
      } else if (!endsAfterToday && event.endTime) {
        // 이전에 시작했지만 오늘 끝나는 경우
        const [endHours, endMinutes] = event.endTime.split(':').map(Number);
        height = (endHours * 60 + endMinutes) * (80 / 60);
      }

      return {
        top,
        height,
        isMultiDay: true,
        continuesFromPrevious: startsBeforeToday,
        continuesToNext: endsAfterToday
      };
    }

    // 단일 날짜 이벤트
    if (!event.startTime) return null;

    const [hours, minutes] = event.startTime.split(':').map(Number);
    const top = (hours * 60 + minutes) * (80 / 60); // 80px per hour

    let height = 80; // 기본 높이
    if (event.endTime) {
      const [endHours, endMinutes] = event.endTime.split(':').map(Number);
      const duration = (endHours * 60 + endMinutes) - (hours * 60 + minutes);
      height = duration * (80 / 60);
    }

    return { top, height, isMultiDay: false };
  };

  return (
    <div className={styles.dayView}>
      <div className={styles.dayHeader}>
        <h2 className={styles.dateTitle}>
          {formatDate(selectedDate, 'yyyy년 M월 d일 EEEE')}
        </h2>
        {hasDiary && (
          <span className={styles.diaryIndicator}><MdCreate /> 일기 작성됨</span>
        )}
      </div>

      <div className={styles.timeGrid}>
        <div className={styles.allDaySection}>
          <div className={styles.allDayLabel}>종일</div>
          <div className={styles.allDayEvents}>
            {dayEvents.filter(e => {
              // 원래 종일 이벤트
              if (!e.startTime && !e.endDate) return true;

              // Multi-day 이벤트 중 이 날짜를 전체로 차지하는 경우
              if (e.endDate && e.date !== e.endDate) {
                const currentDayStart = startOfDay(selectedDate);
                const currentDayEnd = endOfDay(selectedDate);
                const eventStart = new Date(e.date);
                const eventEnd = new Date(e.endDate);

                const startsBeforeToday = isBefore(eventStart, currentDayStart);
                const endsAfterToday = isAfter(eventEnd, currentDayEnd);

                return (startsBeforeToday || !e.startTime || e.startTime === '00:00') &&
                       (endsAfterToday || !e.endTime || e.endTime === '23:59');
              }

              return false;
            }).map(event => (
              <div
                key={event.id}
                className={styles.allDayEvent}
                style={{ backgroundColor: event.color, cursor: 'pointer' }}
                onClick={() => setSelectedEvent(event)}
              >
                {event.title}
                {event.endDate && event.date !== event.endDate && (
                  <span className={styles.multiDayIndicator}>
                    {' '}({format(event.date, 'M/d', { locale: ko })} - {format(event.endDate, 'M/d', { locale: ko })})
                  </span>
                )}
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
            {dayEvents.filter(e => e.startTime || (e.endDate && e.date !== e.endDate)).map(event => {
              const position = getEventPosition(event);
              if (!position) return null;

              return (
                <div
                  key={event.id}
                  className={`${styles.timedEvent} ${position.isMultiDay ? styles.multiDay : ''}`}
                  style={{
                    top: `${position.top}px`,
                    height: `${position.height}px`,
                    backgroundColor: event.color,
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedEvent(event)}
                >
                  {position.continuesFromPrevious && (
                    <div className={styles.continueIndicator}>↑ 이전 날짜부터 계속</div>
                  )}
                  <div className={styles.eventTime}>
                    {position.isMultiDay && event.endDate ? (
                      <>
                        {format(event.date, 'M/d HH:mm', { locale: ko })}
                        {' ~ '}
                        {format(event.endDate, 'M/d HH:mm', { locale: ko })}
                      </>
                    ) : (
                      <>
                        {event.startTime}
                        {event.endTime && ` - ${event.endTime}`}
                      </>
                    )}
                  </div>
                  <div className={styles.eventTitle}>{event.title}</div>
                  {event.description && (
                    <div className={styles.eventDescription}>{event.description}</div>
                  )}
                  {position.continuesToNext && (
                    <div className={styles.continueIndicator}>↓ 다음 날짜로 계속</div>
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