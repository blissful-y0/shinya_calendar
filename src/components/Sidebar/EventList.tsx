import React, { useState } from "react";
import { useSetRecoilState } from "recoil";
import { eventsState } from "@store/atoms";
import { Event } from "@types";
import { formatEventTime } from "@utils/eventUtils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import toast from "react-hot-toast";
import EventForm from "./EventForm";
import styles from "./EventList.module.scss";

interface EventListProps {
  events: Event[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  const setEvents = useSetRecoilState(eventsState);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const handleDelete = (eventId: string) => {
    if (confirm('이 이벤트를 삭제하시겠습니까?')) {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success('이벤트가 삭제되었습니다');
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "오후" : "오전";
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
      {events.map((event) => (
        <div key={event.id} className={styles.eventItem}>
          <div
            className={styles.colorBar}
            style={{ backgroundColor: event.color }}
          />
          <div className={styles.eventContent}>
            <h4 className={styles.eventTitle}>
              {event.title}
              {event.recurrence && (
                <span className={styles.recurringBadge}>반복</span>
              )}
            </h4>
            {event.endDate && event.date !== event.endDate && (
              <p className={styles.eventDateRange}>
                {format(event.date, "MM/dd", { locale: ko })} ~{" "}
                {format(event.endDate, "MM/dd", { locale: ko })}
              </p>
            )}
            {(event.startTime || event.endTime || event.isAllDay) && (
              <p className={styles.eventTime}>
                {event.isAllDay ? (
                  "하루 종일"
                ) : (
                  <>
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </>
                )}
              </p>
            )}
            {event.recurrence && (
              <p className={styles.recurrenceInfo}>
                {event.recurrence.frequency === "daily" && `매일`}
                {event.recurrence.frequency === "weekly" && `매주`}
                {event.recurrence.frequency === "monthly" && `매월`}
                {event.recurrence.frequency === "yearly" && `매년`}
                {event.recurrence.interval &&
                  event.recurrence.interval > 1 &&
                  ` ${event.recurrence.interval}번마다`}
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
