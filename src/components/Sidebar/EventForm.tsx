import React, { useState } from "react";
import { useSetRecoilState } from "recoil";
import { eventsState } from "@store/atoms";
import { Event, RecurrenceRule, ReminderTime } from "@types";
import { v4 as uuidv4 } from "uuid";
import { format, isAfter } from "date-fns";
import { ko } from "date-fns/locale";
import toast from "react-hot-toast";
import styles from "./EventForm.module.scss";

interface EventFormProps {
  date: Date;
  onClose: () => void;
  event?: Event;
}

const EventForm: React.FC<EventFormProps> = ({ date, onClose, event }) => {
  const setEvents = useSetRecoilState(eventsState);
  const [title, setTitle] = useState(event?.title || "");
  const [startDate, setStartDate] = useState(
    format(event?.date || date, "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    event?.endDate
      ? format(event.endDate, "yyyy-MM-dd")
      : format(date, "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState(event?.startTime || "");
  const [endTime, setEndTime] = useState(event?.endTime || "");
  const [description, setDescription] = useState(event?.description || "");
  const [color, setColor] = useState(event?.color || "#FFB6C1");
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false);
  const [isMultiDay, setIsMultiDay] = useState(
    !!event?.endDate && event.date !== event.endDate
  );
  const [isRecurring, setIsRecurring] = useState(!!event?.recurrence);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>(
    event?.recurrence || {
      frequency: "daily",
      interval: 1,
    }
  );
  const [reminder, setReminder] = useState(event?.reminder || false);
  const [reminderTime, setReminderTime] = useState<ReminderTime>(
    event?.reminderTime || "10min"
  );

  const colorOptions = [
    "#FFB6C1",
    "#FFC0CB",
    "#FFE4B5",
    "#E6E6FA",
    "#B0E0E6",
    "#98FB98",
    "#F0E68C",
    "#DDA0DD",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("이벤트 제목을 입력해주세요");
      return;
    }

    // 날짜 유효성 검사
    if (isMultiDay) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isAfter(start, end)) {
        toast.error("시작 날짜가 종료 날짜보다 늦을 수 없습니다");
        return;
      }
    }

    // 시간 유효성 검사 (하루 종일이 아닌 경우)
    if (!isAllDay && startTime && endTime && !isMultiDay) {
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);

      if (
        startHour > endHour ||
        (startHour === endHour && startMin >= endMin)
      ) {
        toast.error("시작 시간이 종료 시간보다 늦을 수 없습니다");
        return;
      }
    }

    const newEvent: Event = {
      id: event?.id || uuidv4(),
      title: title.trim(),
      date: new Date(startDate),
      endDate: isMultiDay ? new Date(endDate) : undefined,
      startTime: !isAllDay ? startTime : undefined,
      endTime: !isAllDay ? endTime : undefined,
      description,
      color,
      isAllDay,
      recurrence: isRecurring ? recurrence : undefined,
      reminder,
      reminderTime: reminder ? reminderTime : undefined,
      tags: [],
    };

    setEvents((prev) => {
      if (event) {
        return prev.map((e) => (e.id === event.id ? newEvent : e));
      }
      return [...prev, newEvent];
    });

    // 성공 메시지 표시
    toast.success(event ? '이벤트가 수정되었습니다' : '이벤트가 추가되었습니다');

    onClose();
  };

  return (
    <form className={styles.eventForm} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="title">이벤트 제목</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="이벤트 제목을 입력하세요"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isMultiDay}
            onChange={(e) => {
              setIsMultiDay(e.target.checked);
              // 다중 날짜 선택 시 반복 이벤트 해제
              if (e.target.checked) {
                setIsRecurring(false);
              }
            }}
          />
          종료 날짜 설정
        </label>
      </div>

      <div className={styles.dateGroup}>
        <div className={styles.formGroup}>
          <label htmlFor="startDate">{isMultiDay ? "시작 날짜" : "날짜"}</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        {isMultiDay && (
          <div className={styles.formGroup}>
            <label htmlFor="endDate">종료 날짜</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              required
            />
          </div>
        )}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
          />
          하루 종일
        </label>
      </div>

      {!isAllDay && (
        <div className={styles.timeGroup}>
          <div className={styles.formGroup}>
            <label htmlFor="startTime">시작 시간</label>
            <input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="endTime">종료 시간</label>
            <input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className={styles.formGroup}>
        <label
          className={`${styles.checkboxLabel} ${
            isMultiDay ? styles.disabled : ""
          }`}
          title={
            isMultiDay
              ? "종료 날짜가 설정된 경우 반복 이벤트를 사용할 수 없습니다"
              : ""
          }
        >
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            disabled={isMultiDay}
          />
          반복 이벤트
          {isMultiDay && (
            <span className={styles.disabledNote}>
              {" "}
              (종료 날짜 설정 시 사용 불가)
            </span>
          )}
        </label>
      </div>

      {isRecurring && (
        <div className={styles.recurrenceGroup}>
          <div className={styles.formGroup}>
            <label htmlFor="frequency">반복 주기</label>
            <select
              id="frequency"
              value={recurrence.frequency}
              onChange={(e) =>
                setRecurrence({
                  ...recurrence,
                  frequency: e.target.value as
                    | "daily"
                    | "weekly"
                    | "monthly"
                    | "yearly",
                })
              }
            >
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
              <option value="monthly">매월</option>
              <option value="yearly">매년</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="interval">반복 간격</label>
            <div className={styles.intervalInput}>
              <input
                id="interval"
                type="number"
                min="1"
                value={recurrence.interval || 1}
                onChange={(e) =>
                  setRecurrence({
                    ...recurrence,
                    interval: parseInt(e.target.value) || 1,
                  })
                }
              />
              <span>
                {recurrence.frequency === "daily" && "일마다"}
                {recurrence.frequency === "weekly" && "주마다"}
                {recurrence.frequency === "monthly" && "개월마다"}
                {recurrence.frequency === "yearly" && "년마다"}
              </span>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="recurrenceEnd">반복 종료</label>
            <input
              id="recurrenceEnd"
              type="date"
              value={
                recurrence.endDate
                  ? format(recurrence.endDate, "yyyy-MM-dd")
                  : ""
              }
              onChange={(e) =>
                setRecurrence({
                  ...recurrence,
                  endDate: e.target.value
                    ? new Date(e.target.value)
                    : undefined,
                })
              }
              min={startDate}
            />
          </div>
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={reminder}
            onChange={(e) => setReminder(e.target.checked)}
            disabled={!startTime && !isAllDay}
          />
          알림 설정
          {!startTime && !isAllDay && (
            <span className={styles.disabledNote}>
              {" "}
              (시간 설정 필요)
            </span>
          )}
        </label>
      </div>

      {reminder && (
        <div className={styles.reminderGroup}>
          <div className={styles.formGroup}>
            <label htmlFor="reminderTime">알림 시간</label>
            <select
              id="reminderTime"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value as ReminderTime)}
            >
              <option value="now">{isAllDay ? '자정 (00:00)' : '이벤트 시작 시'}</option>
              {!isAllDay && (
                <>
                  <option value="5min">5분 전</option>
                  <option value="10min">10분 전</option>
                  <option value="30min">30분 전</option>
                  <option value="1hour">1시간 전</option>
                </>
              )}
            </select>
          </div>
          {isAllDay && (
            <p className={styles.reminderNote}>
              하루 종일 이벤트는 자정에 알림이 울립니다.
            </p>
          )}
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="description">설명</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명 추가 (선택사항)"
          rows={3}
        />
      </div>

      <div className={styles.formGroup}>
        <label>색상</label>
        <div className={styles.colorOptions}>
          {colorOptions.map((colorOption) => (
            <button
              key={colorOption}
              type="button"
              className={`${styles.colorOption} ${
                color === colorOption ? styles.selected : ""
              }`}
              style={{ backgroundColor: colorOption }}
              onClick={() => setColor(colorOption)}
            />
          ))}
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelButton} onClick={onClose}>
          취소
        </button>
        <button type="submit" className={styles.saveButton}>
          {event ? "수정" : "저장"}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
