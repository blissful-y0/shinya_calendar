import React, { useState } from "react";
import { useSetRecoilState, useRecoilState } from "recoil";
import { eventsState, selectedEventState } from "@store/atoms";
import { Event } from "@types";
import { formatEventTime } from "@utils/eventUtils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import toast from "react-hot-toast";
import EventForm from "./EventForm";
import EventDetail from "./EventDetail";
import RecurringEventDeleteModal from "@components/Common/RecurringEventDeleteModal";
import styles from "./EventList.module.scss";

interface EventListProps {
  events: Event[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  const setEvents = useSetRecoilState(eventsState);
  const [selectedEvent, setSelectedEvent] = useRecoilState(selectedEventState);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setSelectedEvent(null);
  };

  const handleDelete = (event: Event) => {
    // 반복 이벤트인 경우 모달 표시
    if (event.recurrence || event.baseEventId) {
      setDeletingEvent(event);
      setShowDeleteModal(true);
    } else {
      // 일반 이벤트는 바로 삭제 확인
      if (confirm('이 이벤트를 삭제하시겠습니까?')) {
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
        toast.success('이벤트가 삭제되었습니다');
      }
    }
  };

  const handleDeleteSingle = () => {
    if (!deletingEvent) return;

    // 단일 인스턴스만 삭제 (excludeDates에 추가)
    const targetId = deletingEvent.baseEventId || deletingEvent.id;
    const dateToExclude = deletingEvent.date.toISOString();

    setEvents((prev) => prev.map((e) => {
      if (e.id === targetId) {
        return {
          ...e,
          recurrence: e.recurrence ? {
            ...e.recurrence,
            excludeDates: [...(e.recurrence.excludeDates || []), dateToExclude]
          } : undefined
        };
      }
      return e;
    }));

    setShowDeleteModal(false);
    setDeletingEvent(null);
    toast.success('선택한 이벤트가 삭제되었습니다');
  };

  const handleDeleteAll = () => {
    if (!deletingEvent) return;

    // 전체 시리즈 삭제
    const targetId = deletingEvent.baseEventId || deletingEvent.id;
    setEvents((prev) => prev.filter((e) => e.id !== targetId));
    setShowDeleteModal(false);
    setDeletingEvent(null);
    toast.success('모든 반복 이벤트가 삭제되었습니다');
  };

  const formatTime = (time?: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "오후" : "오전";
    const displayHour = hour % 12 || 12;
    return `${ampm} ${displayHour}:${minutes}`;
  };

  if (selectedEvent) {
    // 선택된 이벤트를 events 배열에서 찾기
    // 반복 이벤트의 경우 전달된 events prop에 인스턴스가 포함되어 있음
    const event = events.find(e => e.id === selectedEvent.id);
    if (event) {
      return (
        <EventDetail
          event={event}
          onEdit={() => handleEdit(event)}
        />
      );
    }
  }

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
        <div
          key={event.id}
          className={styles.eventItem}
          onClick={() => handleEventClick(event)}
          style={{ cursor: 'pointer' }}
        >
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
              onClick={(e) => {
                e.stopPropagation();
                setEditingEvent(event);
              }}
            >
              수정
            </button>
            <button
              className={styles.deleteButton}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(event);
              }}
            >
              삭제
            </button>
          </div>
        </div>
      ))}

      {deletingEvent && (
        <RecurringEventDeleteModal
          isOpen={showDeleteModal}
          eventTitle={deletingEvent.title}
          eventDate={deletingEvent.date}
          onDeleteSingle={handleDeleteSingle}
          onDeleteAll={handleDeleteAll}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeletingEvent(null);
          }}
        />
      )}
    </div>
  );
};

export default EventList;
