import React, { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { sidebarOpenState } from '@store/atoms';
import Header from '@components/Common/Header';
import Calendar from '@components/Calendar/Calendar';
import Sidebar from '@components/Sidebar/Sidebar';
import { useTheme } from '@hooks/useTheme';
import styles from './App.module.scss';

function App() {
  const sidebarOpen = useRecoilValue(sidebarOpenState);
  const { currentTheme } = useTheme();

  useEffect(() => {
    document.title = 'Shinya Calendar';
  }, []);

  return (
    <div className={styles.app}>
      <Header />
      <div className={styles.mainContent}>
        <div className={`${styles.calendarContainer} ${!sidebarOpen ? styles.fullWidth : ''}`}>
          <Calendar />
        </div>
        <Sidebar />
      </div>
    </div>
  );
}

export default App;