import React, { useState, useEffect } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  selectedDateState,
  selectedEventState,
  eventsState,
  diaryEntriesState,
  sidebarOpenState,
} from "@store/atoms";
import EventForm from "./EventForm";
import EventList from "./EventList";
import DiarySection from "./DiarySection";
import DDayWidget from "../Common/DDayWidget";
import { formatDate } from "@utils/calendar";
import { getEventsForDate } from "@utils/eventUtils";
import { startOfMonth, endOfMonth, addMonths } from "date-fns";
import styles from "./Sidebar.module.scss";

const Sidebar: React.FC = () => {
  const [sidebarOpen] = useRecoilState(sidebarOpenState);
  const selectedDate = useRecoilValue(selectedDateState);
  const setSelectedEvent = useSetRecoilState(selectedEventState);
  const events = useRecoilValue(eventsState);
  const diaryEntries = useRecoilValue(diaryEntriesState);
  const [activeTab, setActiveTab] = useState<"events" | "diary">("events");
  const [showEventForm, setShowEventForm] = useState(false);

  // 날짜가 변경되면 선택된 이벤트 초기화
  useEffect(() => {
    setSelectedEvent(null);
  }, [selectedDate, setSelectedEvent]);

  // 탭이 변경되면 선택된 이벤트 초기화
  const handleTabChange = (tab: "events" | "diary") => {
    setActiveTab(tab);
    setSelectedEvent(null);
  };

  // 이벤트 추가 폼을 열 때 선택된 이벤트 초기화
  const handleToggleEventForm = () => {
    setShowEventForm(!showEventForm);
    if (!showEventForm) {
      setSelectedEvent(null);
    }
  };

  // 반복 이벤트를 포함하여 선택된 날짜의 이벤트 가져오기
  // 선택된 날짜 기준 3개월 범위로 반복 이벤트 계산
  const rangeStart = startOfMonth(addMonths(selectedDate, -1));
  const rangeEnd = endOfMonth(addMonths(selectedDate, 2));
  const selectedDateEvents = getEventsForDate(
    events,
    selectedDate,
    rangeStart,
    rangeEnd
  );

  const selectedDateDiary = diaryEntries.find(
    (entry) => formatDate(new Date(entry.date)) === formatDate(selectedDate)
  );

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
      <DDayWidget />
      <div className={styles.divider}></div>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.dateTitle}>{formatDate(selectedDate)}</h3>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "events" ? styles.active : ""
            }`}
            onClick={() => handleTabChange("events")}
          >
            이벤트
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "diary" ? styles.active : ""
            }`}
            onClick={() => handleTabChange("diary")}
          >
            일기
          </button>
        </div>
      </div>

      <div className={styles.sidebarContent}>
        {activeTab === "events" && (
          <>
            <div className={styles.actionBar}>
              <button
                className={styles.addButton}
                onClick={handleToggleEventForm}
              >
                {showEventForm ? "취소" : "+ 이벤트 추가"}
              </button>
            </div>
            {showEventForm && (
              <EventForm
                date={selectedDate}
                onClose={() => setShowEventForm(false)}
              />
            )}
            <EventList events={selectedDateEvents} />
          </>
        )}

        {activeTab === "diary" && (
          <DiarySection date={selectedDate} entry={selectedDateDiary} />
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
