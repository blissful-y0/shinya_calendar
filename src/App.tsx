import React, { useEffect } from "react";
import { useRecoilValue } from "recoil";
import { sidebarOpenState, viewModeState } from "@store/atoms";
import TitleBar from "@components/Layout/TitleBar";
import Header from "@components/Common/Header";
import Calendar from "@components/Calendar/Calendar";
import DayView from "@components/Calendar/DayView";
import WeekView from "@components/Calendar/WeekView";
import Sidebar from "@components/Sidebar/Sidebar";
import ResizableLayout from "@components/Common/ResizableLayout";
import { useTheme } from "@hooks/useTheme";
import styles from "./App.module.scss";

function App() {
  const sidebarOpen = useRecoilValue(sidebarOpenState);
  const viewMode = useRecoilValue(viewModeState);
  const { currentTheme } = useTheme();

  useEffect(() => {
    document.title = "";
  }, []);

  const renderView = () => {
    switch (viewMode) {
      case "day":
        return <DayView />;
      case "week":
        return <WeekView />;
      case "month":
        return <Calendar />;
      default:
        return <Calendar />;
    }
  };

  return (
    <div className={styles.app}>
      <TitleBar />
      <Header />
      <div className={styles.mainContent}>
        {sidebarOpen ? (
          <ResizableLayout sidebar={<Sidebar />} minWidth={280} maxWidth={600}>
            <div className={styles.calendarContainer}>{renderView()}</div>
          </ResizableLayout>
        ) : (
          <div className={styles.calendarContainer}>{renderView()}</div>
        )}
      </div>
    </div>
  );
}

export default App;
