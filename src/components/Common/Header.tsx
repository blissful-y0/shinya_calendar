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
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { FcGoogle } from "react-icons/fc";
import { MdDeleteForever } from "react-icons/md";
import { FiInfo } from "react-icons/fi";
import toast from "react-hot-toast";
import { electronStore } from "@utils/electronStore";
import { getCurrentVersion, checkForUpdates } from "@utils/version";
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
  const [appVersion, setAppVersion] = useState<string>("");
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);

  // 앱 버전 로드 및 업데이트 확인
  useEffect(() => {
    const loadVersion = async () => {
      try {
        const version = await getCurrentVersion();
        setAppVersion(version);

        // 업데이트 확인 (백그라운드에서)
        checkForUpdates()
          .then((updateInfo) => {
            setHasUpdate(updateInfo.hasUpdate);
          })
          .catch((error) => {
            console.error("Update check failed:", error);
          });
      } catch (error) {
        console.error("Failed to load version:", error);
      }
    };

    loadVersion();
  }, []);

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
      const newDate = dayjs(selectedDate).subtract(1, "day").toDate();
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    } else if (viewMode === "week") {
      const newDate = dayjs(selectedDate).subtract(1, "week").toDate();
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    } else {
      setCurrentMonth(getPreviousMonth(currentMonth));
    }
  };

  const handleNext = () => {
    if (viewMode === "day") {
      const newDate = dayjs(selectedDate).add(1, "day").toDate();
      setSelectedDate(newDate);
      setCurrentMonth(newDate);
    } else if (viewMode === "week") {
      const newDate = dayjs(selectedDate).add(1, "week").toDate();
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
      return dayjs(selectedDate).locale("ko").format("YYYY년 M월 D일 dddd");
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

  // 버전 확인
  const handleCheckVersion = async () => {
    setShowMenu(false);

    toast.loading("버전 확인 중...");

    try {
      const updateInfo = await checkForUpdates();

      toast.dismiss();

      if (updateInfo.hasUpdate) {
        const confirmed = window.confirm(
          `새로운 버전이 있습니다!\n\n` +
            `현재 버전: ${updateInfo.currentVersion}\n` +
            `최신 버전: ${updateInfo.latestVersion}\n\n` +
            `다운로드 페이지로 이동하시겠습니까?`
        );

        if (confirmed && updateInfo.url) {
          window.open(
            "https://www.postype.com/@sungbaeking/post/20527213",
            "_blank"
          );
        }
      } else {
        toast.success(
          `최신 버전을 사용 중입니다.\n현재 버전: ${updateInfo.currentVersion}`,
          { duration: 3000 }
        );
      }
    } catch (error) {
      toast.dismiss();
      toast.error("버전 확인 중 오류가 발생했습니다.");
      console.error("Version check failed:", error);
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
        {appVersion && (
          <div
            className={styles.versionBadge}
            onClick={handleCheckVersion}
            title={
              hasUpdate
                ? "새로운 버전이 있습니다! 클릭하여 확인하세요."
                : "버전 정보"
            }
          >
            <span className={styles.versionText}>v{appVersion}</span>
            {hasUpdate && <span className={styles.updateDot}>●</span>}
          </div>
        )}
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
              <button onClick={handleCheckVersion}>
                <FiInfo size={16} /> 버전 확인
              </button>
              <button
                onClick={async () => {
                  setShowMenu(false);

                  const confirmed = window.confirm(
                    "기존 이벤트 데이터를 새로운 형식으로 변환하시겠습니까?\n\n" +
                      "이 작업은 RRULE 도입 이전의 반복 이벤트 데이터를 현재 형식으로 업데이트합니다.\n" +
                      "- 주별 반복: 시작일의 요일을 byweekday로 설정\n" +
                      "- 월별 반복: 시작일의 날짜를 bymonthday로 설정\n\n" +
                      "진행하시겠습니까?"
                  );

                  if (!confirmed) return;

                  try {
                    // 기존 이벤트 데이터 가져오기
                    const events = (await electronStore.get("events")) || [];
                    let convertedCount = 0;

                    // 이전 형식을 현재 형식으로 변환
                    const convertedEvents = events.map((event: any) => {
                      // recurrence가 없으면 변환 불필요
                      if (!event.recurrence) {
                        return event;
                      }

                      const recurrence = event.recurrence;
                      let needsConversion = false;
                      const newRecurrence = { ...recurrence };

                      // 주별 반복: byweekday가 없으면 시작일의 요일로 설정
                      if (
                        recurrence.frequency === "weekly" &&
                        !recurrence.byweekday
                      ) {
                        const eventDate = new Date(event.date);
                        const dayOfWeek = eventDate.getDay(); // 0=일요일, 1=월요일...
                        const rruleDayOfWeek =
                          dayOfWeek === 0 ? 6 : dayOfWeek - 1; // RRule: 0=월요일
                        newRecurrence.byweekday = [rruleDayOfWeek];
                        needsConversion = true;
                      }

                      // 월별 반복: bymonthday와 bysetpos가 없으면 시작일의 날짜로 설정
                      if (
                        recurrence.frequency === "monthly" &&
                        !recurrence.bymonthday &&
                        !recurrence.bysetpos
                      ) {
                        const eventDate = new Date(event.date);
                        newRecurrence.bymonthday = eventDate.getDate();
                        needsConversion = true;
                      }

                      // byweekday 정렬 (이미 있는 경우)
                      if (
                        recurrence.byweekday &&
                        Array.isArray(recurrence.byweekday)
                      ) {
                        newRecurrence.byweekday = [
                          ...recurrence.byweekday,
                        ].sort((a: number, b: number) => a - b);
                        needsConversion = true;
                      }

                      if (needsConversion) {
                        convertedCount++;
                        return {
                          ...event,
                          recurrence: newRecurrence,
                        };
                      }

                      return event;
                    });

                    // 변환된 데이터 저장
                    await electronStore.set("events", convertedEvents);

                    toast.success(
                      `${convertedCount}개의 이벤트를 새로운 형식으로 변환했습니다. 페이지를 새로고침합니다.`
                    );

                    // 페이지 새로고침
                    setTimeout(() => window.location.reload(), 1500);
                  } catch (error) {
                    console.error("데이터 변환 실패:", error);
                    toast.error("데이터 변환에 실패했습니다.");
                  }
                }}
              >
                기존 데이터 옮기기
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleResetStore();
                }}
                className={styles.dangerButton}
              >
                데이터 초기화
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
