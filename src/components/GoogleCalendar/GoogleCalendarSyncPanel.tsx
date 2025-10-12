import React, { useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { googleCalendarSyncState, eventsState } from "@store/atoms";
import { useGoogleCalendarSync } from "@hooks/useGoogleCalendarSync";
import { googleCalendarService } from "@services/googleCalendarService";
import { FcGoogle } from "react-icons/fc";
import { FiDownload, FiUpload, FiRefreshCw, FiArrowLeft, FiCheck, FiLogOut } from "react-icons/fi";
import styles from "./GoogleCalendarSyncPanel.module.scss";
import toast from "react-hot-toast";

type GoogleCalendar = {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole?: string;
};

type GoogleCalendarSyncPanelProps = {
  onClose: () => void;
};

export const GoogleCalendarSyncPanel: React.FC<
  GoogleCalendarSyncPanelProps
> = ({ onClose }) => {
  const [syncState, setSyncState] = useRecoilState(googleCalendarSyncState);
  const events = useRecoilValue(eventsState);
  const {
    importFromGoogle,
    exportMultipleToGoogle,
    syncBidirectional,
    isSyncing,
  } = useGoogleCalendarSync();

  const [dateRange, setDateRange] = useState<"week" | "month" | "year" | "all">(
    "month"
  );

  // 연동 관련 상태
  const [isConnecting, setIsConnecting] = useState(false);

  // 캘린더 선택 관련 상태
  const [showCalendarSelection, setShowCalendarSelection] = useState(false);
  const [availableCalendars, setAvailableCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);

  // 구글 캘린더 연동
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      if (
        !window.electronAPI?.googleOAuth ||
        !window.electronAPI?.openExternal
      ) {
        toast.error("Electron API를 사용할 수 없습니다");
        return;
      }

      // 1. OAuth 서버 시작
      const serverPromise = window.electronAPI.googleOAuth.start();

      // 2. 브라우저 열기
      const authUrl = googleCalendarService.getAuthUrl();
      await window.electronAPI.openExternal(authUrl);

      // 3. OAuth 서버에서 code 받기 대기
      const result = await serverPromise;

      if (!result.success || !result.code) {
        throw new Error(result.error || "인증 실패");
      }

      // 4. code를 토큰으로 교환
      const auth = await googleCalendarService.getTokenFromCode(result.code);
      const userEmail = await googleCalendarService.getUserEmail(
        auth.access_token
      );

      setSyncState({
        isConnected: true,
        userEmail,
        autoSync: false,
        lastSyncTime: new Date(),
      });

      toast.success(`구글 캘린더 연동 완료: ${userEmail}`);
    } catch (error) {
      console.error("Google Calendar connection failed:", error);
      toast.error("구글 캘린더 연동 실패. 다시 시도해주세요.");
    } finally {
      setIsConnecting(false);
    }
  };

  // 구글 캘린더 연동 해제
  const handleDisconnect = async () => {
    if (!window.confirm("구글 캘린더 연동을 해제하시겠습니까?")) {
      return;
    }

    setIsConnecting(true);
    try {
      await googleCalendarService.disconnect();
      setSyncState({
        isConnected: false,
        autoSync: false,
      });
      toast.success("구글 캘린더 연동 해제됨");
    } catch (error) {
      console.error("Disconnect failed:", error);
      toast.error("연동 해제 실패");
    } finally {
      setIsConnecting(false);
    }
  };

  // 자동 동기화 토글
  const handleToggleAutoSync = () => {
    setSyncState({
      ...syncState,
      autoSync: !syncState.autoSync,
    });
  };

  const getDateRange = () => {
    const now = new Date();
    let timeMin = new Date();
    let timeMax: Date | undefined;

    switch (dateRange) {
      case "week":
        timeMin.setDate(now.getDate() - 7);
        timeMax = new Date(now);
        timeMax.setDate(now.getDate() + 7);
        break;
      case "month":
        timeMin.setMonth(now.getMonth() - 1);
        timeMax = new Date(now);
        timeMax.setMonth(now.getMonth() + 1);
        break;
      case "year":
        timeMin.setFullYear(now.getFullYear() - 1);
        timeMax = new Date(now);
        timeMax.setFullYear(now.getFullYear() + 1);
        break;

      // 사용 안함
      case "all":
        timeMin = new Date(2000, 0, 1);
        timeMax = undefined;
        break;
    }

    return { timeMin, timeMax };
  };

  // 캘린더 목록 불러오기 (캐시 사용)
  const loadCalendars = async () => {
    setIsLoadingCalendars(true);
    try {
      // 캐시 사용 (forceRefresh = false)
      const calendars = await googleCalendarService.listCalendars(false);
      setAvailableCalendars(calendars);
      // 기본적으로 모든 캘린더 선택
      setSelectedCalendarIds(calendars.map((cal) => cal.id));
      setShowCalendarSelection(true);
    } catch (error) {
      console.error("Failed to load calendars:", error);
      toast.error("캘린더 목록 불러오기 실패");
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  // 캘린더 선택 토글
  const toggleCalendar = (calendarId: string) => {
    setSelectedCalendarIds((prev) =>
      prev.includes(calendarId)
        ? prev.filter((id) => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  // 모두 선택/해제
  const toggleAllCalendars = () => {
    if (selectedCalendarIds.length === availableCalendars.length) {
      setSelectedCalendarIds([]);
    } else {
      setSelectedCalendarIds(availableCalendars.map((cal) => cal.id));
    }
  };

  // "가져오기" 버튼 클릭
  const handleImportClick = async () => {
    await loadCalendars();
  };

  // 선택한 캘린더에서 이벤트 가져오기
  const handleImport = async () => {
    if (selectedCalendarIds.length === 0) {
      toast.error("최소 1개 이상의 캘린더를 선택해주세요");
      return;
    }

    const { timeMin, timeMax } = getDateRange();
    try {
      await importFromGoogle(timeMin, timeMax, selectedCalendarIds);
      setShowCalendarSelection(false);
    } catch (error) {
      // Error already handled in hook
    }
  };

  // 캘린더 선택 취소
  const handleCancelSelection = () => {
    setShowCalendarSelection(false);
    setAvailableCalendars([]);
    setSelectedCalendarIds([]);
  };

  const handleExport = async () => {
    if (events.length === 0) {
      toast.error("내보낼 이벤트가 없습니다");
      return;
    }

    const confirmed = window.confirm(
      `${events.length}개의 이벤트를 구글 캘린더로 보내시겠습니까?`
    );

    if (!confirmed) return;

    try {
      await exportMultipleToGoogle(events);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleSync = async () => {
    try {
      await syncBidirectional();
    } catch (error) {
      // Error already handled in hook
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>
            <FcGoogle size={32} />
            구글 캘린더
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          {/* 연동되지 않은 경우 */}
          {!syncState.isConnected ? (
            <div className={styles.connectSection}>
              <p className={styles.description}>
                구글 캘린더와 연동하여 이벤트를 동기화하세요.
              </p>
              <button
                className={styles.connectButton}
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <FiRefreshCw className={styles.spinning} />
                    연동 중...
                  </>
                ) : (
                  <>
                    <FcGoogle size={24} />
                    구글 계정으로 연동하기
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {/* 연동된 경우 */}
              <div className={styles.connectionStatus}>
                <div className={styles.statusBadge}>연동됨</div>
                <p>{syncState.userEmail}</p>
                {syncState.lastSyncTime && (
                  <p className={styles.lastSync}>
                    마지막 동기화: {syncState.lastSyncTime.toLocaleString("ko-KR")}
                  </p>
                )}
              </div>

              {/* 자동 동기화 설정 */}
              <div className={styles.section}>
                <label className={styles.settingItem}>
                  <input
                    type="checkbox"
                    checked={syncState.autoSync}
                    onChange={handleToggleAutoSync}
                  />
                  <span>자동 동기화 활성화</span>
                </label>
                <p className={styles.settingDescription}>
                  이벤트 추가/수정 시 자동으로 구글 캘린더와 동기화합니다
                </p>
              </div>

          <div className={styles.section}>
            <h3>동기화 범위</h3>
            <div className={styles.rangeSelector}>
              <button
                className={dateRange === "week" ? styles.active : ""}
                onClick={() => setDateRange("week")}
              >
                1주일
              </button>
              <button
                className={dateRange === "month" ? styles.active : ""}
                onClick={() => setDateRange("month")}
              >
                1개월
              </button>
              <button
                className={dateRange === "year" ? styles.active : ""}
                onClick={() => setDateRange("year")}
              >
                1년
              </button>
            </div>
          </div>

          {/* 캘린더 선택 화면 */}
          {showCalendarSelection ? (
            <div className={styles.calendarSelection}>
              <div className={styles.selectionHeader}>
                <button
                  className={styles.backButton}
                  onClick={handleCancelSelection}
                  disabled={isSyncing}
                >
                  <FiArrowLeft size={20} />
                  뒤로
                </button>
                <h3>가져올 캘린더 선택</h3>
              </div>

              <div className={styles.calendarList}>
                <div className={styles.selectAllContainer}>
                  <label className={styles.calendarItem}>
                    <input
                      type="checkbox"
                      checked={
                        selectedCalendarIds.length === availableCalendars.length &&
                        availableCalendars.length > 0
                      }
                      onChange={toggleAllCalendars}
                      disabled={isLoadingCalendars}
                    />
                    <div className={styles.calendarInfo}>
                      <strong>모두 선택</strong>
                    </div>
                  </label>
                </div>

                {isLoadingCalendars ? (
                  <div className={styles.loading}>
                    <FiRefreshCw className={styles.spinning} />
                    <p>캘린더 목록 불러오는 중...</p>
                  </div>
                ) : (
                  availableCalendars.map((calendar) => (
                    <label key={calendar.id} className={styles.calendarItem}>
                      <input
                        type="checkbox"
                        checked={selectedCalendarIds.includes(calendar.id)}
                        onChange={() => toggleCalendar(calendar.id)}
                      />
                      <div className={styles.calendarInfo}>
                        <strong>
                          {calendar.summary}
                          {calendar.primary && (
                            <span className={styles.primaryBadge}>기본</span>
                          )}
                        </strong>
                        {calendar.description && (
                          <p className={styles.description}>{calendar.description}</p>
                        )}
                        <p className={styles.accessRole}>권한: {calendar.accessRole}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className={styles.selectionActions}>
                <button
                  className={styles.cancelButton}
                  onClick={handleCancelSelection}
                  disabled={isSyncing}
                >
                  취소
                </button>
                <button
                  className={`${styles.importButton} ${styles.primary}`}
                  onClick={handleImport}
                  disabled={isSyncing || selectedCalendarIds.length === 0}
                >
                  {isSyncing ? (
                    <>
                      <FiRefreshCw className={styles.spinning} />
                      가져오는 중...
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      선택한 캘린더에서 가져오기 ({selectedCalendarIds.length}개)
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.section}>
                <h3>동기화 작업</h3>
                <div className={styles.actions}>
                  <button
                    className={styles.actionButton}
                    onClick={handleImportClick}
                    disabled={isSyncing || isLoadingCalendars}
                  >
                    {isLoadingCalendars ? (
                      <FiRefreshCw size={20} className={styles.spinning} />
                    ) : (
                      <FiDownload size={20} />
                    )}
                    <div>
                      <strong>가져오기</strong>
                      <p>구글 캘린더에서 이벤트 가져오기</p>
                    </div>
                  </button>

              <button
                className={styles.actionButton}
                onClick={handleExport}
                disabled={isSyncing || events.length === 0}
              >
                <FiUpload size={20} />
                <div>
                  <strong>보내기</strong>
                  <p>구글 캘린더로 이벤트 보내기 ({events.length}개)</p>
                </div>
              </button>

              <button
                className={`${styles.actionButton} ${styles.primary}`}
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <FiRefreshCw size={20} className={styles.spinning} />
                ) : (
                  <FiRefreshCw size={20} />
                )}
                <div>
                  <strong>양방향 동기화</strong>
                  <p>구글 캘린더와 완전 동기화</p>
                </div>
              </button>
            </div>
          </div>

          {syncState.autoSync && (
            <div className={styles.autoSyncNotice}>
              <p>
                ℹ️ 자동 동기화가 활성화되어 있습니다. 이벤트를 추가/수정하면
                자동으로 구글 캘린더와 동기화됩니다.
              </p>
            </div>
          )}
          </>
          )}

              {/* 연동 해제 버튼 */}
              <button
                className={styles.disconnectButton}
                onClick={handleDisconnect}
                disabled={isConnecting}
              >
                <FiLogOut />
                연동 해제
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
