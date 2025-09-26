import React, { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { eventsState } from '@store/atoms';
import { Event } from '@types/index';
import EventForm from './EventForm';
import styles from './EventList.module.scss';

interface EventListProps {
  events: Event[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  const setEvents = useSetRecoilState(eventsState);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const handleDelete = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? '오후' : '오전';
    const displayHour = hour % 12 || 12;
    return `${ampm} ${displayHour}:${minutes}`;
  };

  if (editingEvent) {
    return (
      <EventForm
        date={new Date(editingEvent.date)}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
      />
    );
  }

  if (events.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>이 날짜에 이벤트가 없습니다</p>
        <span>"이벤트 추가"를 클릭하여 생성하세요</span>
      </div>
    );
  }

  return (
    <div className={styles.eventList}>
      {events.map(event => (
        <div key={event.id} className={styles.eventItem}>
          <div
            className={styles.colorBar}
            style={{ backgroundColor: event.color }}
          />
          <div className={styles.eventContent}>
            <h4 className={styles.eventTitle}>{event.title}</h4>
            {(event.startTime || event.endTime) && (
              <p className={styles.eventTime}>
                {formatTime(event.startTime)}
                {event.endTime && ` - ${formatTime(event.endTime)}`}
              </p>
            )}
            {event.description && (
              <p className={styles.eventDescription}>{event.description}</p>
            )}
          </div>
          <div className={styles.eventActions}>
            <button
              className={styles.editButton}
              onClick={() => setEditingEvent(event)}
            >
              수정
            </button>
            <button
              className={styles.deleteButton}
              onClick={() => handleDelete(event.id)}
            >
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventList;