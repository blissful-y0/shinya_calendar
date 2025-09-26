import React from "react";
import { useRecoilState } from "recoil";
import {
  currentMonthState,
  selectedDateState,
  sidebarOpenState,
  viewModeState,
  stickerVisibilityState,
} from "@store/atoms";
import { getNextMonth, getPreviousMonth, monthNames } from "@utils/calendar";
import { addDays, addWeeks, subDays, subWeeks, format } from "date-fns";
import { ko } from "date-fns/locale";
import styles from "./Header.module.scss";

const Header: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useRecoilState(currentMonthState);
  const [selectedDate, setSelectedDate] = useRecoilState(selectedDateState);
  const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
  const [viewMode, setViewMode] = useRecoilState(viewModeState);
  const [stickerVisibility, setStickerVisibility] = useRecoilState(
    stickerVisibilityState
  );

  const handlePrevious = () => {
    if (viewMode === "day") {
      const newDate = subDays(selectedDate, 1);
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    } else if (viewMode === "week") {
      const newDate = subWeeks(selectedDate, 1);
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    } else {
      setCurrentMonth(getPreviousMonth(currentMonth));
    }
  };

  const handleNext = () => {
    if (viewMode === "day") {
      const newDate = addDays(selectedDate, 1);
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    } else if (viewMode === "week") {
      const newDate = addWeeks(selectedDate, 1);
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
      return format(selectedDate, "yyyy년 M월 d일 EEEE", { locale: ko });
    } else if (viewMode === "week") {
      return format(selectedDate, "yyyy년 M월", { locale: ko });
    } else {
      return `${currentMonth.getFullYear()}년 ${monthNames[currentMonth.getMonth()]}`;
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
          ☆
        </button>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewButton} ${
              viewMode === "day" ? styles.active : ""
            }`}
            onClick={() => setViewMode("day")}
          >
            일
          </button>
          <button
            className={`${styles.viewButton} ${
              viewMode === "week" ? styles.active : ""
            }`}
            onClick={() => setViewMode("week")}
          >
            주
          </button>
          <button
            className={`${styles.viewButton} ${
              viewMode === "month" ? styles.active : ""
            }`}
            onClick={() => setViewMode("month")}
          >
            월
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
