import React, { useState, useEffect, useRef } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  currentMonthState,
  selectedDateState,
  selectedEventState,
  sidebarOpenState,
  viewModeState,
  stickerVisibilityState,
} from "@store/atoms";
import { getNextMonth, getPreviousMonth, monthNames } from "@utils/calendar";
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { FcGoogle } from "react-icons/fc";
import { MdDeleteForever } from "react-icons/md";
import toast from "react-hot-toast";
import { electronStore } from "@utils/electronStore";
import styles from "./Header.module.scss";

// Lazy load Google Calendar components
const GoogleCalendarSync = React.lazy(() =>
  import("@components/GoogleCalendar/GoogleCalendarSync").then((m) => ({
    default: m.GoogleCalendarSync,
  }))
);
const GoogleCalendarSyncPanel = React.lazy(() =>
  import("@components/GoogleCalendar/GoogleCalendarSyncPanel").then((m) => ({
    default: m.GoogleCalendarSyncPanel,
  }))
);

const Header: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useRecoilState(currentMonthState);
  const [selectedDate, setSelectedDate] = useRecoilState(selectedDateState);
  const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
  const [viewMode, setViewMode] = useRecoilState(viewModeState);
  const setSelectedEvent = useSetRecoilState(selectedEventState);
  const [stickerVisibility, setStickerVisibility] = useRecoilState(
    stickerVisibilityState
  );
  const [showGoogleCalendarSettings, setShowGoogleCalendarSettings] =
    useState(false);
  const [showGoogleCalendarSync, setShowGoogleCalendarSync] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handlePrevious = () => {
    if (viewMode === "day") {
      const newDate = dayjs(selectedDate).subtract(1, 'day').toDate();
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    } else if (viewMode === "week") {
      const newDate = dayjs(selectedDate).subtract(1, 'week').toDate();
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    } else {
      setCurrentMonth(getPreviousMonth(currentMonth));
    }
  };

  const handleNext = () => {
    if (viewMode === "day") {
      const newDate = dayjs(selectedDate).add(1, 'day').toDate();
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    } else if (viewMode === "week") {
      const newDate = dayjs(selectedDate).add(1, 'week').toDate();
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    } else {
      setCurrentMonth(getNextMonth(currentMonth));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  const getDateDisplay = () => {
    if (viewMode === "day") {
      return dayjs(selectedDate).locale('ko').format("YYYY년 M월 D일 dddd");
    } else if (viewMode === "week") {
      return dayjs(selectedDate).format("YYYY년 M월");
    } else {
      return `${currentMonth.getFullYear()}년 ${
        monthNames[currentMonth.getMonth()]
      }`;
    }
  };

  const handleResetStore = async () => {
    const confirmed = window.confirm(
      "모든 데이터를 초기화하시겠습니까?\n이벤트, 일기, 구글 캘린더 연동 정보 등 모든 데이터가 삭제됩니다.\n\n이 작업은 되돌릴 수 없습니다."
    );

    if (!confirmed) return;

    try {
      // 모든 store 데이터 삭제
      await electronStore.set("events", []);

      toast.success("모든 데이터가 초기화되었습니다. 페이지를 새로고침합니다.");

      // 페이지 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to reset store:", error);
      toast.error("데이터 초기화 실패");
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <button
          className={styles.menuButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className={styles.menuIcon}>☰</span>
        </button>
        <h1 className={styles.title}></h1>
      </div>

      <div className={styles.centerSection}>
        <button className={styles.navButton} onClick={handlePrevious}>
          ←
        </button>
        <div className={styles.currentMonth}>
          <h2>{getDateDisplay()}</h2>
        </div>
        <button className={styles.navButton} onClick={handleNext}>
          →
        </button>
        <button className={styles.todayButton} onClick={handleToday}>
          오늘
        </button>
      </div>

      <div className={styles.rightSection}>
        <button
          className={`${styles.stickerToggle} ${
            stickerVisibility ? styles.active : ""
          }`}
          onClick={() => setStickerVisibility(!stickerVisibility)}
          title={stickerVisibility ? "스티커 숨기기" : "스티커 보이기"}
        >
          {stickerVisibility ? "ON" : "OFF"}
        </button>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewButton} ${
              viewMode === "day" ? styles.active : ""
            }`}
            onClick={() => {
              setViewMode("day");
              setSelectedEvent(null);
            }}
          >
            일
          </button>
          <button
            className={`${styles.viewButton} ${
              viewMode === "week" ? styles.active : ""
            }`}
            onClick={() => {
              setViewMode("week");
              setSelectedEvent(null);
            }}
          >
            주
          </button>
          <button
            className={`${styles.viewButton} ${
              viewMode === "month" ? styles.active : ""
            }`}
            onClick={() => {
              setViewMode("month");
              setSelectedEvent(null);
            }}
          >
            월
          </button>
        </div>
        <div className={styles.googleMenu} ref={menuRef}>
          <button
            className={styles.googleButton}
            onClick={() => setShowMenu(!showMenu)}
            title="구글 캘린더"
          >
            <FcGoogle size={24} />
          </button>
          {showMenu && (
            <div className={styles.dropdown}>
              <button
                onClick={() => {
                  setShowGoogleCalendarSettings(true);
                  setShowMenu(false);
                }}
              >
                구글 캘린더 연동 설정
              </button>
              <button
                onClick={() => {
                  setShowGoogleCalendarSync(true);
                  setShowMenu(false);
                }}
              >
                이벤트 동기화
              </button>
              <button
                onClick={async () => {
                  setShowMenu(false);
                  // byweekday 정렬 수정
                  const events = await electronStore.get('events') || [];
                  const fixedEvents = events.map((event: any) => {
                    if (event.recurrence?.byweekday && Array.isArray(event.recurrence.byweekday)) {
                      return {
                        ...event,
                        recurrence: {
                          ...event.recurrence,
                          byweekday: [...event.recurrence.byweekday].sort((a: number, b: number) => a - b)
                        }
                      };
                    }
                    return event;
                  });
                  await electronStore.set('events', fixedEvents);
                  toast.success('요일 데이터를 수정했습니다. 새로고침합니다.');
                  setTimeout(() => window.location.reload(), 1000);
                }}
              >
                🔧 요일 데이터 수정
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleResetStore();
                }}
                className={styles.dangerButton}
              >
                <MdDeleteForever size={16} /> 데이터 초기화
              </button>
            </div>
          )}
        </div>
      </div>
      {showGoogleCalendarSettings && (
        <React.Suspense fallback={<div>로딩 중...</div>}>
          <GoogleCalendarSync
            onClose={() => setShowGoogleCalendarSettings(false)}
          />
        </React.Suspense>
      )}
      {showGoogleCalendarSync && (
        <React.Suspense fallback={<div>로딩 중...</div>}>
          <GoogleCalendarSyncPanel
            onClose={() => setShowGoogleCalendarSync(false)}
          />
        </React.Suspense>
      )}
    </header>
  );
};

export default Header;
