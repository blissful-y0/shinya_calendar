import React, { useState, useEffect } from 'react';
import styles from './TitleBar.module.scss';

const TitleBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.titleBar}>
      <div className={styles.dragRegion}>
        <div className={styles.appTitle}>
          <span className={styles.icon}>📅</span>
          <span className={styles.title}>신야 캘린더</span>
        </div>
      </div>
      <div className={styles.controls}>
        <div className={styles.currentTime}>
          {currentTime.toLocaleString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}
        </div>
      </div>
    </div>
  );
};

export default TitleBar;