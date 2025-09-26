import React, { useEffect, useState } from 'react';
import { VscChromeMinimize, VscChromeMaximize, VscChromeRestore, VscChromeClose } from 'react-icons/vsc';
import styles from './WindowTitleBar.module.scss';

const WindowTitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    // 플랫폼 체크
    if (window.electronAPI?.getPlatform) {
      window.electronAPI.getPlatform().then(setPlatform);
    }

    // 최대화 상태 체크
    const checkMaximized = async () => {
      if (window.electronAPI?.isMaximized) {
        const maximized = await window.electronAPI.isMaximized();
        setIsMaximized(maximized);
      }
    };

    checkMaximized();

    // 윈도우 리사이즈 이벤트 리스너
    const handleResize = () => checkMaximized();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI?.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI?.maximizeWindow) {
      await window.electronAPI.maximizeWindow();
      const maximized = await window.electronAPI.isMaximized();
      setIsMaximized(maximized);
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
    }
  };

  // Windows 플랫폼이 아니면 타이틀바를 표시하지 않음
  if (platform !== 'win32') {
    return null;
  }

  return (
    <div className={styles.titleBar}>
      <div className={styles.dragRegion}>
        <span className={styles.title}>신야 캘린더</span>
      </div>
      <div className={styles.windowControls}>
        <button
          className={styles.windowButton}
          onClick={handleMinimize}
          title="최소화"
        >
          <VscChromeMinimize />
        </button>
        <button
          className={styles.windowButton}
          onClick={handleMaximize}
          title={isMaximized ? "복원" : "최대화"}
        >
          {isMaximized ? <VscChromeRestore /> : <VscChromeMaximize />}
        </button>
        <button
          className={`${styles.windowButton} ${styles.closeButton}`}
          onClick={handleClose}
          title="닫기"
        >
          <VscChromeClose />
        </button>
      </div>
    </div>
  );
};

export default WindowTitleBar;