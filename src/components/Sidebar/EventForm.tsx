import React, { useState } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { eventsState, selectedEventState, googleCalendarSyncState } from "@store/atoms";
import { Event, RecurrenceRule, ReminderTime } from "@types";
import { v4 as uuidv4 } from "uuid";
import { format, isAfter, parse } from "date-fns";
import { ko } from "date-fns/locale";
import toast from "react-hot-toast";
import CustomDatePicker from "@components/Common/CustomDatePicker";
import CustomTimePicker from "@components/Common/CustomTimePicker";
import { HexColorPicker } from "react-colorful";
import { useGoogleCalendarSync } from "@/hooks/useGoogleCalendarSync";
import styles from "./EventForm.module.scss";

interface EventFormProps {
  date: Date;
  onClose: () => void;
  event?: Event;
}

const EventForm: React.FC<EventFormProps> = ({ date, onClose, event }) => {
  const setEvents = useSetRecoilState(eventsState);
  const setSelectedEvent = useSetRecoilState(selectedEventState);
  // 구글 캘린더 동기화 상태 가져오기
  const syncState = useRecoilValue(googleCalendarSyncState);
  // 구글 캘린더 동기화 훅
  const { exportToGoogle } = useGoogleCalendarSync();
  const [title, setTitle] = useState(event?.title || "");
  const [startDate, setStartDate] = useState<Date>(
    event?.date ? new Date(event.date) : date
  );
  const [endDate, setEndDate] = useState<Date>(
    event?.endDate
      ? new Date(event.endDate)
      : event?.date
      ? new Date(event.date)
      : date
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [startTime, setStartTime] = useState(event?.startTime || "");
  const [endTime, setEndTime] = useState(event?.endTime || "");
  const [description, setDescription] = useState(event?.description || "");
  const [color, setColor] = useState(event?.color || "#FFB6C1");
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false);
  const [isMultiDay, setIsMultiDay] = useState(
    !!event?.endDate &&
      new Date(event.date).getTime() !== new Date(event.endDate).getTime()
  );
  const [isRecurring, setIsRecurring] = useState(!!event?.recurrence);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>(() => {
    const baseRecurrence = event?.recurrence || {
      frequency: "daily",
      interval: 1,
    };
    // byweekday가 있으면 정렬
    if (baseRecurrence.byweekday && baseRecurrence.byweekday.length > 0) {
      return {
        ...baseRecurrence,
        byweekday: [...baseRecurrence.byweekday].sort((a, b) => a - b),
      };
    }
    return baseRecurrence;
  });
  const [monthlyType, setMonthlyType] = useState<"dayofmonth" | "dayofweek">(
    event?.recurrence?.bymonthday ? "dayofmonth" : "dayofweek"
  );
  const [reminder, setReminder] = useState(event?.reminder || false);
  const [reminderTime, setReminderTime] = useState<ReminderTime>(
    event?.reminderTime || "10min"
  );
  const [reminderForAllOccurrences, setReminderForAllOccurrences] = useState(
    event?.reminderForAllOccurrences || false
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("이벤트 제목을 입력해주세요");
      return;
    }

    // 날짜 유효성 검사
    if (isMultiDay) {
      if (isAfter(startDate, endDate)) {
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

    // 반복 이벤트 설정 처리
    let finalRecurrence = isRecurring ? { ...recurrence } : undefined;

    if (isRecurring && finalRecurrence) {
      // 월별 반복 설정
      if (recurrence.frequency === "monthly") {
        if (monthlyType === "dayofmonth") {
          finalRecurrence.bymonthday = startDate.getDate();
          delete finalRecurrence.byweekday;
          delete finalRecurrence.bysetpos;
        } else {
          // dayofweek: 몇 번째 무슨 요일
          const dayOfWeek = startDate.getDay(); // 0=일요일, 1=월요일...
          const rruleDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // RRule: 0=월요일
          const weekOfMonth = Math.ceil(startDate.getDate() / 7);

          finalRecurrence.byweekday = [rruleDayOfWeek];
          finalRecurrence.bysetpos = weekOfMonth;
          delete finalRecurrence.bymonthday;
        }
      }

      // 주별 반복 시 요일이 선택되지 않았으면 시작일의 요일 사용
      if (
        recurrence.frequency === "weekly" &&
        (!finalRecurrence.byweekday || finalRecurrence.byweekday.length === 0)
      ) {
        const dayOfWeek = startDate.getDay();
        const rruleDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        finalRecurrence.byweekday = [rruleDayOfWeek];
      }
    }

    const newEvent: Event = {
      id: event?.id || uuidv4(),
      title: title.trim(),
      date: startDate,
      endDate: isMultiDay ? endDate : undefined,
      startTime: !isAllDay ? startTime : undefined,
      endTime: !isAllDay ? endTime : undefined,
      description,
      color,
      isAllDay,
      recurrence: finalRecurrence,
      reminder,
      reminderTime: reminder ? reminderTime : undefined,
      reminderForAllOccurrences:
        reminder && isRecurring ? reminderForAllOccurrences : undefined,
      tags: [],
    };

    // 로컬 상태에 이벤트 저장
    setEvents((prev) => {
      if (event) {
        // 반복 이벤트의 경우 baseEventId 사용, 없으면 원본 ID 추출
        const targetId = event.baseEventId || event.id;
        return prev.map((e) => (e.id === targetId ? newEvent : e));
      }
      return [...prev, newEvent];
    });

    // 성공 메시지 표시
    toast.success(
      event ? "이벤트가 수정되었습니다" : "이벤트가 추가되었습니다"
    );

    // 구글 캘린더 자동 동기화 (연동된 경우에만)
    if (syncState.isConnected) {
      // 구글 캘린더에서 가져온 이벤트인지 확인 (ID가 'google_'로 시작)
      const isGoogleEvent = newEvent.id.startsWith('google_');

      // 구글 캘린더에서 가져온 이벤트가 아닌 경우에만 동기화
      if (!isGoogleEvent) {
        try {
          await exportToGoogle(newEvent);
          console.log("구글 캘린더에 이벤트가 동기화되었습니다:", newEvent.title);
        } catch (error) {
          console.error("구글 캘린더 동기화 실패:", error);
          // 에러가 발생해도 로컬 저장은 완료되었으므로 사용자에게 별도 에러 표시 안 함
        }
      } else {
        console.log("구글 캘린더 이벤트는 자동 동기화하지 않습니다:", newEvent.title);
      }
    }

    // 선택된 이벤트 초기화
    setSelectedEvent(null);
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
          <label>{isMultiDay ? "시작 날짜" : "날짜"}</label>
          <CustomDatePicker
            selected={startDate}
            onChange={(date) => date && setStartDate(date)}
            placeholderText="날짜를 선택하세요"
          />
        </div>
        {isMultiDay && (
          <div className={styles.formGroup}>
            <label>종료 날짜</label>
            <CustomDatePicker
              selected={endDate}
              onChange={(date) => date && setEndDate(date)}
              placeholderText="종료 날짜를 선택하세요"
              minDate={startDate}
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
            <label>시작 시간</label>
            <CustomTimePicker
              value={startTime}
              onChange={setStartTime}
              placeholderText="시작 시간 선택"
            />
          </div>
          <div className={styles.formGroup}>
            <label>종료 시간</label>
            <CustomTimePicker
              value={endTime}
              onChange={setEndTime}
              placeholderText="종료 시간 선택"
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

          {/* 주별 반복 시 요일 선택 */}
          {recurrence.frequency === "weekly" && (
            <div className={styles.formGroup}>
              <label>반복 요일</label>
              <div className={styles.weekdaySelector}>
                {["월", "화", "수", "목", "금", "토", "일"].map(
                  (day, index) => {
                    const rruleIndex = index; // RRule: 0=월요일
                    const isSelected =
                      recurrence.byweekday?.includes(rruleIndex) || false;
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`${styles.weekdayButton} ${
                          isSelected ? styles.selected : ""
                        }`}
                        onClick={() => {
                          const currentDays = recurrence.byweekday || [];
                          const newDays = isSelected
                            ? currentDays.filter((d) => d !== rruleIndex)
                            : [...currentDays, rruleIndex].sort();
                          setRecurrence({
                            ...recurrence,
                            byweekday: newDays.length > 0 ? newDays : undefined,
                          });
                        }}
                      >
                        {day}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* 월별 반복 시 옵션 선택 */}
          {recurrence.frequency === "monthly" && (
            <div className={styles.formGroup}>
              <label>반복 방식</label>
              <div className={styles.monthlyOptions}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="monthlyType"
                    checked={monthlyType === "dayofmonth"}
                    onChange={() => setMonthlyType("dayofmonth")}
                  />
                  매월 {startDate.getDate()}일
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="monthlyType"
                    checked={monthlyType === "dayofweek"}
                    onChange={() => setMonthlyType("dayofweek")}
                  />
                  매월 {Math.ceil(startDate.getDate() / 7)}번째{" "}
                  {
                    ["일", "월", "화", "수", "목", "금", "토"][
                      startDate.getDay()
                    ]
                  }
                  요일
                </label>
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>반복 종료</label>
            <CustomDatePicker
              selected={recurrence.endDate || null}
              onChange={(date) =>
                setRecurrence({
                  ...recurrence,
                  endDate: date || undefined,
                })
              }
              placeholderText="반복 종료일 선택 (선택사항)"
              minDate={startDate}
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
            <span className={styles.disabledNote}> (시간 설정 필요)</span>
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
              <option value="now">
                {isAllDay ? "자정 (00:00)" : "이벤트 시작 시"}
              </option>
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

          {isRecurring && reminder && (
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={reminderForAllOccurrences}
                  onChange={(e) =>
                    setReminderForAllOccurrences(e.target.checked)
                  }
                />
                모든 반복 일정에 알림 적용
              </label>
              <p className={styles.reminderNote}>
                {reminderForAllOccurrences
                  ? "반복되는 모든 일정에 알림이 설정됩니다."
                  : "첫 번째 일정에만 알림이 설정됩니다."}
              </p>
            </div>
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
        <div className={styles.colorSection}>
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
          {showColorPicker && (
            <div className={styles.colorPickerPopover}>
              <div
                className={styles.colorPickerCover}
                onClick={() => setShowColorPicker(false)}
              />
              <HexColorPicker color={color} onChange={setColor} />
            </div>
          )}
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
