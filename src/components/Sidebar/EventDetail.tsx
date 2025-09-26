import React from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { selectedEventState, eventsState } from "@store/atoms";
import { Event } from "@types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import toast from "react-hot-toast";
import styles from "./EventDetail.module.scss";

interface EventDetailProps {
  event: Event;
  onEdit: () => void;
}

const EventDetail: React.FC<EventDetailProps> = ({ event, onEdit }) => {
  const [selectedEvent, setSelectedEvent] = useRecoilState(selectedEventState);
  const setEvents = useSetRecoilState(eventsState);

  const handleClose = () => {
    setSelectedEvent(null);
  };

  const handleDelete = () => {
    if (confirm("이 이벤트를 삭제하시겠습니까?")) {
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      setSelectedEvent(null);
      toast.success("이벤트가 삭제되었습니다");
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

  return (
    <div className={styles.eventDetail}>
      <div className={styles.detailHeader}>
        <button className={styles.closeButton} onClick={handleClose}>
          ←
        </button>
        <h3>이벤트 상세</h3>
      </div>

      <div className={styles.detailBody}>
        <div className={styles.detailContent}>
          <div className={styles.detailGroup}>
            <label>제목</label>
            <div className={styles.detailValue}>
              {event.title}
              {event.recurrence && (
                <span className={styles.recurringBadge}>반복</span>
              )}
            </div>
          </div>

          <div className={styles.detailGroup}>
            <label>날짜</label>
            <div className={styles.detailValue}>
              {event.endDate && event.date !== event.endDate ? (
                <>
                  {format(event.date, "yyyy년 MM월 dd일", { locale: ko })} ~{" "}
                  {format(event.endDate, "yyyy년 MM월 dd일", { locale: ko })}
                </>
              ) : (
                format(event.date, "yyyy년 MM월 dd일 EEEE", { locale: ko })
              )}
            </div>
          </div>

          {(event.startTime || event.endTime || event.isAllDay) && (
            <div className={styles.detailGroup}>
              <label>시간</label>
              <div className={styles.detailValue}>
                {event.isAllDay ? (
                  "하루 종일"
                ) : (
                  <>
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </>
                )}
              </div>
            </div>
          )}

          {event.recurrence && (
            <div className={styles.detailGroup}>
              <label>반복</label>
              <div className={styles.detailValue}>
                {event.recurrence.frequency === "daily" && "매일"}
                {event.recurrence.frequency === "weekly" && "매주"}
                {event.recurrence.frequency === "monthly" && "매월"}
                {event.recurrence.frequency === "yearly" && "매년"}
                {event.recurrence.interval && event.recurrence.interval > 1 && (
                  <> {event.recurrence.interval}번마다</>
                )}
                {event.recurrence.endDate && (
                  <div className={styles.recurrenceEnd}>
                    종료:{" "}
                    {format(event.recurrence.endDate, "yyyy년 MM월 dd일", {
                      locale: ko,
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {event.reminder && event.reminderTime && (
            <div className={styles.detailGroup}>
              <label>알림</label>
              <div className={styles.detailValue}>
                {event.reminderTime === "now" &&
                  (event.isAllDay ? "자정 (00:00)" : "이벤트 시작 시")}
                {event.reminderTime === "5min" && "5분 전"}
                {event.reminderTime === "10min" && "10분 전"}
                {event.reminderTime === "30min" && "30분 전"}
                {event.reminderTime === "1hour" && "1시간 전"}
              </div>
            </div>
          )}

          {event.description && (
            <div className={styles.detailGroup}>
              <label>설명</label>
              <div className={styles.detailValue}>{event.description}</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.detailActions}>
        <button className={styles.editButton} onClick={onEdit}>
          수정
        </button>
        <button className={styles.deleteButton} onClick={handleDelete}>
          삭제
        </button>
      </div>
    </div>
  );
};

export default EventDetail;
