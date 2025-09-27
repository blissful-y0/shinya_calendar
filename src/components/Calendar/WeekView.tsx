import React from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { selectedDateState, selectedEventState, eventsState, diaryEntriesState } from '@store/atoms';
import { getDaysInWeek, formatDate, isSameDayAs, isCurrentDay } from '@utils/calendar';
import { getEventsForDate } from '@utils/eventUtils';
import { Event } from '@types';
import { startOfMonth, endOfMonth, addMonths, startOfDay, endOfDay, isBefore, isAfter, differenceInDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MdCreate } from 'react-icons/md';
import styles from './WeekView.module.scss';

const WeekView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useRecoilState(selectedDateState);
  const setSelectedEvent = useSetRecoilState(selectedEventState);
  const events = useRecoilValue(eventsState);
  const diaryEntries = useRecoilValue(diaryEntriesState);

  const weekDays = getDaysInWeek(selectedDate);
  const weekDayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const getEventsForDateLocal = (date: Date) => {
    // 반복 이벤트를 포함하여 해당 날짜의 이벤트 가져오기
    const rangeStart = startOfMonth(addMonths(date, -1));
    const rangeEnd = endOfMonth(addMonths(date, 1));
    return getEventsForDate(events, date, rangeStart, rangeEnd)
      .sort((a, b) => {
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

  const getEventPosition = (event: Event, dayIndex: number, currentDate: Date) => {
    const PIXELS_PER_HOUR = 80;
    const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

    // Multi-day 이벤트 처리
    if (event.endDate && event.date !== event.endDate) {
      const weekStart = weekDays[0];
      const weekEnd = weekDays[6];
      const eventStart = new Date(event.date);
      const eventEnd = new Date(event.endDate);

      // 이벤트가 이번 주를 포함하는지 확인
      const startsBeforeWeek = isBefore(eventStart, weekStart);
      const endsAfterWeek = isAfter(eventEnd, weekEnd);

      // 현재 날짜에서의 시작 시간 계산
      const currentDayStart = startOfDay(currentDate);
      const currentDayEnd = endOfDay(currentDate);
      const startsBeforeToday = isBefore(eventStart, currentDayStart);
      const endsAfterToday = isAfter(eventEnd, currentDayEnd);

      // 시작 위치 계산
      let top = 0;
      if (!startsBeforeToday && event.startTime) {
        const [hours, minutes] = event.startTime.split(':').map(Number);
        top = (hours * 60 + minutes) * PIXELS_PER_MINUTE;
      }

      // 높이 계산
      let height = 1440 * PIXELS_PER_MINUTE; // 전체 24시간
      if (!startsBeforeToday && !endsAfterToday && event.startTime && event.endTime) {
        // 오늘 시작하고 오늘 끝나는 경우
        const [startHours, startMinutes] = event.startTime.split(':').map(Number);
        const [endHours, endMinutes] = event.endTime.split(':').map(Number);
        const durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        height = durationMinutes * PIXELS_PER_MINUTE;
      } else if (!startsBeforeToday && event.startTime) {
        // 오늘 시작하지만 다른 날에 끝나는 경우
        const [startHours, startMinutes] = event.startTime.split(':').map(Number);
        const remainingMinutes = 1440 - (startHours * 60 + startMinutes);
        height = remainingMinutes * PIXELS_PER_MINUTE;
      } else if (!endsAfterToday && event.endTime) {
        // 이전에 시작했지만 오늘 끝나는 경우
        const [endHours, endMinutes] = event.endTime.split(':').map(Number);
        const elapsedMinutes = endHours * 60 + endMinutes;
        height = elapsedMinutes * PIXELS_PER_MINUTE;
      }

      // 가로 위치와 너비 계산 (여러 날에 걸친 경우)
      let left = dayIndex * (100 / 7);
      let width = 100 / 7;

      // 이벤트가 여러 날에 걸쳐있는 경우
      const eventStartDay = weekDays.findIndex(day => isSameDayAs(day, eventStart));
      const eventEndDay = weekDays.findIndex(day => isSameDayAs(day, eventEnd));

      if (eventStartDay !== -1 && eventEndDay !== -1 && eventStartDay <= dayIndex && dayIndex <= eventEndDay) {
        // 이벤트가 현재 주 내에서 여러 날에 걸침
        if (dayIndex === eventStartDay) {
          // 시작 날짜
          const daysSpanning = Math.min(eventEndDay - eventStartDay + 1, 7 - eventStartDay);
          width = (100 / 7) * daysSpanning;
        } else {
          // 중간이나 끝 날짜는 이미 시작 날짜에서 처리됨
          return null;
        }
      } else if (startsBeforeWeek && eventEndDay >= dayIndex) {
        // 이전 주에서 시작
        if (dayIndex === 0) {
          const daysSpanning = Math.min(eventEndDay + 1, 7);
          left = 0;
          width = (100 / 7) * daysSpanning;
        } else {
          return null;
        }
      } else if (endsAfterWeek && eventStartDay <= dayIndex) {
        // 다음 주로 이어짐
        if (dayIndex === eventStartDay) {
          width = (100 / 7) * (7 - eventStartDay);
        } else {
          return null;
        }
      }

      return {
        top,
        height,
        left,
        width,
        isMultiDay: true,
        continuesFromPrevious: startsBeforeToday,
        continuesToNext: endsAfterToday,
        eventStart,
        eventEnd
      };
    }

    // 단일 날짜 이벤트
    if (!event.startTime) return null;

    const [hours, minutes] = event.startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const top = startMinutes * PIXELS_PER_MINUTE;

    let height = PIXELS_PER_HOUR; // Default height (1 hour)
    if (event.endTime) {
      const [endHours, endMinutes] = event.endTime.split(':').map(Number);
      const endTotalMinutes = endHours * 60 + endMinutes;
      const durationMinutes = endTotalMinutes - startMinutes;
      // Ensure proper height for short events (at least 25px for readability)
      height = Math.max(durationMinutes * PIXELS_PER_MINUTE, 25);
    }

    const left = dayIndex * (100 / 7);
    const width = 100 / 7;

    return { top, height, left, width, isMultiDay: false };
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
            const dayEvents = getEventsForDateLocal(date).filter(e => !e.startTime);
            return (
              <div key={date.toISOString()} className={styles.allDayCell}>
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={styles.allDayEvent}
                    style={{ backgroundColor: event.color, cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setSelectedDate(date);
                    }}
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
                const dayEvents = getEventsForDateLocal(date).filter(e => e.startTime || (e.endDate && e.date !== e.endDate));
                return dayEvents.map(event => {
                  const position = getEventPosition(event, dayIndex, date);
                  if (!position) return null;

                  return (
                    <div
                      key={`${event.id}-${dayIndex}`}
                      className={`${styles.timedEvent} ${position.isMultiDay ? styles.multiDay : ''}`}
                      style={{
                        top: `${position.top}px`,
                        height: `${position.height}px`,
                        left: `${position.left}%`,
                        width: `calc(${position.width}% - 4px)`,
                        backgroundColor: event.color,
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectedEvent(event);
                        setSelectedDate(date);
                      }}
                    >
                      {position.continuesFromPrevious && (
                        <div className={styles.continueIndicator}>← 이전부터</div>
                      )}
                      <div className={styles.eventTime}>
                        {position.isMultiDay && position.eventStart && position.eventEnd ? (
                          <>
                            {format(position.eventStart, 'M/d HH:mm')}
                            {' ~ '}
                            {format(position.eventEnd, 'M/d HH:mm')}
                          </>
                        ) : (
                          event.startTime
                        )}
                      </div>
                      <div className={styles.eventTitle}>
                        {event.title}
                      </div>
                      {position.continuesToNext && (
                        <div className={styles.continueIndicator}>다음으로 →</div>
                      )}
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