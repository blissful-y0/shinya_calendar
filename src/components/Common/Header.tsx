import React from "react";
import { useRecoilState } from "recoil";
import {
  currentMonthState,
  sidebarOpenState,
  viewModeState,
} from "@store/atoms";
import { getNextMonth, getPreviousMonth, monthNames } from "@utils/calendar";
import styles from "./Header.module.scss";

const Header: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useRecoilState(currentMonthState);
  const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
  const [viewMode, setViewMode] = useRecoilState(viewModeState);

  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
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
        <button className={styles.navButton} onClick={handlePreviousMonth}>
          ←
        </button>
        <div className={styles.currentMonth}>
          <h2>
            {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
          </h2>
        </div>
        <button className={styles.navButton} onClick={handleNextMonth}>
          →
        </button>
        <button className={styles.todayButton} onClick={handleToday}>
          오늘
        </button>
      </div>

      <div className={styles.rightSection}>
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
