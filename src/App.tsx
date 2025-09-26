import React, { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { sidebarOpenState, viewModeState } from '@store/atoms';
import Header from '@components/Common/Header';
import Calendar from '@components/Calendar/Calendar';
import DayView from '@components/Calendar/DayView';
import WeekView from '@components/Calendar/WeekView';
import Sidebar from '@components/Sidebar/Sidebar';
import { useTheme } from '@hooks/useTheme';
import styles from './App.module.scss';

function App() {
  const sidebarOpen = useRecoilValue(sidebarOpenState);
  const viewMode = useRecoilValue(viewModeState);
  const { currentTheme } = useTheme();

  useEffect(() => {
    document.title = 'Shinya Calendar';
  }, []);

  const renderView = () => {
    switch (viewMode) {
      case 'day':
        return <DayView />;
      case 'week':
        return <WeekView />;
      case 'month':
        return <Calendar />;
      default:
        return <Calendar />;
    }
  };

  return (
    <div className={styles.app}>
      <Header />
      <div className={styles.mainContent}>
        <div className={`${styles.calendarContainer} ${!sidebarOpen ? styles.fullWidth : ''}`}>
          {renderView()}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}

export default App;