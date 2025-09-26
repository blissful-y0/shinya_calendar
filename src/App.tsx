import { useEffect, useRef, useCallback } from "react";
import { useRecoilValue, useSetRecoilState, useRecoilState } from "recoil";
import { sidebarOpenState, viewModeState, stickerEditModeState, stickersState, currentThemeState, bannerImageState } from "@store/atoms";
import { Toaster } from 'react-hot-toast';
import TitleBar from "@components/Layout/TitleBar";
import WindowTitleBar from "@components/Common/WindowTitleBar";
import Header from "@components/Common/Header";
import Calendar from "@components/Calendar/Calendar";
import DayView from "@components/Calendar/DayView";
import WeekView from "@components/Calendar/WeekView";
import Sidebar from "@components/Sidebar/Sidebar";
import ResizableLayout from "@components/Common/ResizableLayout";
import CustomBanner from "@components/Common/CustomBanner";
import FloatingActionButton from "@components/Styling/FloatingActionButton";
import StickerCanvas from "@components/Styling/StickerCanvas";
import FloatingToolbar from "@components/Styling/FloatingToolbar";
import { useTheme } from "@hooks/useTheme";
import styles from "./App.module.scss";

function App() {
  const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
  const [viewMode, setViewMode] = useRecoilState(viewModeState);
  const stickerEditMode = useRecoilValue(stickerEditModeState);
  const setStickerEditMode = useSetRecoilState(stickerEditModeState);
  const [stickers, setStickers] = useRecoilState(stickersState);
  const [currentTheme, setCurrentTheme] = useRecoilState(currentThemeState);
  const [bannerImage, setBannerImage] = useRecoilState(bannerImageState);
  useTheme(); // Apply theme automatically
  const previousStickersRef = useRef(stickers);
  const isEditModeStartingRef = useRef(false);

  // 앱 시작 시 이전 상태 복원
  useEffect(() => {
    document.title = "";

    const restoreAppState = async () => {
      try {
        if (window.electronAPI?.store) {
          // UI 상태 복원
          const savedUIState = await window.electronAPI.store.get('appUIState');
          if (savedUIState) {
            if (typeof savedUIState.sidebarOpen === 'boolean') {
              setSidebarOpen(savedUIState.sidebarOpen);
            }
            if (['month', 'week', 'day'].includes(savedUIState.viewMode)) {
              setViewMode(savedUIState.viewMode);
            }
            if (savedUIState.currentTheme) {
              setCurrentTheme(savedUIState.currentTheme);
            }
            if (typeof savedUIState.bannerImage === 'string' || savedUIState.bannerImage === null) {
              setBannerImage(savedUIState.bannerImage);
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore app state:', error);
      }
    };

    restoreAppState();
  }, []);

  // 앱 종료 시 현재 상태 저장
  useEffect(() => {
    const saveAppState = async () => {
      try {
        if (window.electronAPI?.store) {
          // UI 상태 저장
          await window.electronAPI.store.set('appUIState', {
            sidebarOpen,
            viewMode,
            currentTheme,
            bannerImage
          });
        }
      } catch (error) {
        console.error('Failed to save app state:', error);
      }
    };

    // 앱 종료 이벤트 리스너 등록
    if (window.electronAPI?.onAppBeforeQuit) {
      window.electronAPI.onAppBeforeQuit(saveAppState);
    }

    // 클린업: 이벤트 리스너 제거
    return () => {
      if (window.electronAPI?.removeAppBeforeQuitListener) {
        window.electronAPI.removeAppBeforeQuitListener(saveAppState);
      }
    };
  }, [sidebarOpen, viewMode, currentTheme, bannerImage]);

  // 편집 모드 상태 변화 감지
  useEffect(() => {
    if (stickerEditMode && !isEditModeStartingRef.current) {
      // 편집 모드 시작 시에만 현재 상태 저장
      previousStickersRef.current = [...stickers];
      isEditModeStartingRef.current = true;
    } else if (!stickerEditMode) {
      // 편집 모드 종료 시 플래그 리셋
      isEditModeStartingRef.current = false;
    }
  }, [stickerEditMode, stickers]);

  const handleEditComplete = useCallback(() => {
    setStickerEditMode(false);
  }, [setStickerEditMode]);

  const handleEditCancel = useCallback(() => {
    setStickers(previousStickersRef.current);
    setStickerEditMode(false);
  }, [setStickers, setStickerEditMode]);

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
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          },
          error: {
            style: {
              background: 'var(--color-danger-light)',
              color: 'var(--color-danger)',
              border: '1px solid var(--color-danger)',
            },
          },
        }}
      />
      <WindowTitleBar />
      <TitleBar />
      <Header />
      <div className={styles.mainContent}>
        {sidebarOpen ? (
          <ResizableLayout sidebar={<Sidebar />} minWidth={240} maxWidth={480}>
            <div className={styles.calendarContainer}>
              <CustomBanner />
              {renderView()}
            </div>
          </ResizableLayout>
        ) : (
          <div className={styles.calendarContainer}>
            <CustomBanner />
            {renderView()}
          </div>
        )}
      </div>
      <StickerCanvas />
      {stickerEditMode && (
        <FloatingToolbar
          onClose={handleEditComplete}
          onCancel={handleEditCancel}
        />
      )}
      <FloatingActionButton />
    </div>
  );
}

export default App;
