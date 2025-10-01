import React, { useState } from "react";
import { useRecoilValue } from "recoil";
import { googleCalendarSyncState, eventsState } from "@store/atoms";
import { useGoogleCalendarSync } from "@hooks/useGoogleCalendarSync";
import { FcGoogle } from "react-icons/fc";
import { FiDownload, FiUpload, FiRefreshCw } from "react-icons/fi";
import styles from "./GoogleCalendarSyncPanel.module.scss";
import toast from "react-hot-toast";

type GoogleCalendarSyncPanelProps = {
  onClose: () => void;
};

export const GoogleCalendarSyncPanel: React.FC<
  GoogleCalendarSyncPanelProps
> = ({ onClose }) => {
  const syncState = useRecoilValue(googleCalendarSyncState);
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

  if (!syncState.isConnected) {
    return (
      <div className={styles.modal}>
        <div className={styles.overlay} onClick={onClose} />
        <div className={styles.content}>
          <div className={styles.header}>
            <h2>
              <FcGoogle size={32} />
              구글 캘린더 동기화
            </h2>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>
          <div className={styles.body}>
            <p className={styles.notConnected}>
              구글 캘린더에 연동되어 있지 않습니다. 먼저 연동 설정을
              완료해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  const handleImport = async () => {
    const { timeMin, timeMax } = getDateRange();
    try {
      await importFromGoogle(timeMin, timeMax);
    } catch (error) {
      // Error already handled in hook
    }
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
            구글 캘린더 동기화
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.connectionStatus}>
            <div className={styles.statusBadge}>연동됨</div>
            <p>{syncState.userEmail}</p>
            {syncState.lastSyncTime && (
              <p className={styles.lastSync}>
                마지막 동기화: {syncState.lastSyncTime.toLocaleString("ko-KR")}
              </p>
            )}
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

          <div className={styles.section}>
            <h3>동기화 작업</h3>
            <div className={styles.actions}>
              <button
                className={styles.actionButton}
                onClick={handleImport}
                disabled={isSyncing}
              >
                <FiDownload size={20} />
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
        </div>
      </div>
    </div>
  );
};
