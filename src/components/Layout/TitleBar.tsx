import React, { useState, useEffect } from "react";
import styles from "./TitleBar.module.scss";

const TitleBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    // 플랫폼 체크
    if (window.electronAPI?.getPlatform) {
      window.electronAPI.getPlatform().then(setPlatform);
    }
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Windows 플랫폼인 경우 타이틀바를 표시하지 않음
  if (platform === 'win32') {
    return null;
  }
  
  return (
    <div className={styles.titleBar}>
      <div className={styles.dragRegion}>
        <div className={styles.appTitle}></div>
      </div>
      <div className={styles.controls}>
        <div className={styles.currentTime}>
          {currentTime.toLocaleString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
