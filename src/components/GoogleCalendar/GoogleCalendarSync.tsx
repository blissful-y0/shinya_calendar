import React, { useState, useEffect } from "react";
import { useRecoilState } from "recoil";
import { googleCalendarSyncState } from "@store/atoms";
import { googleCalendarService } from "@/services/googleCalendarService";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { FiRefreshCw, FiLogOut, FiCheck } from "react-icons/fi";
import styles from "./GoogleCalendarSync.module.scss";

type GoogleCalendarSyncProps = {
  onClose: () => void;
};

export const GoogleCalendarSync: React.FC<GoogleCalendarSyncProps> = ({
  onClose,
}) => {
  const [syncState, setSyncState] = useRecoilState(googleCalendarSyncState);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      if (!window.electronAPI?.googleOAuth || !window.electronAPI?.openExternal) {
        toast.error("Electron API를 사용할 수 없습니다");
        return;
      }

      // 1. OAuth 서버 시작 (먼저!)
      const serverPromise = window.electronAPI.googleOAuth.start();

      // 2. 서버 시작 직후 브라우저 열기
      const authUrl = googleCalendarService.getAuthUrl();
      await window.electronAPI.openExternal(authUrl);

      // 3. OAuth 서버에서 code 받기 대기
      const result = await serverPromise;

      if (!result.success || !result.code) {
        throw new Error(result.error || "인증 실패");
      }

      // 4. code를 토큰으로 교환
      const auth = await googleCalendarService.getTokenFromCode(result.code);
      const userEmail = await googleCalendarService.getUserEmail(auth.access_token);

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
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("구글 캘린더 연동을 해제하시겠습니까?")) {
      return;
    }

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleToggleAutoSync = () => {
    setSyncState({
      ...syncState,
      autoSync: !syncState.autoSync,
    });
  };

  return (
    <div className={styles.modal}>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>
            <FcGoogle size={32} />
            구글 캘린더 연동
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          {!syncState.isConnected ? (
            <div className={styles.connectSection}>
              <p className={styles.description}>
                구글 캘린더와 연동하여 이벤트를 동기화할 수 있습니다.
              </p>

              <div className={styles.instructions}>
                <h3>연동 방법:</h3>
                <ol>
                  <li>아래 버튼을 클릭하면 브라우저가 열립니다</li>
                  <li>구글 계정으로 로그인하고 권한을 승인합니다</li>
                  <li>자동으로 연동이 완료됩니다</li>
                </ol>
              </div>

              <button
                className={styles.connectButton}
                onClick={handleConnect}
                disabled={isLoading}
              >
                {isLoading ? (
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
            <div className={styles.connectedSection}>
              <div className={styles.statusCard}>
                <div className={styles.statusIcon}>
                  <FiCheck size={24} />
                </div>
                <div className={styles.statusInfo}>
                  <h3>연동됨</h3>
                  <p>{syncState.userEmail}</p>
                  {syncState.lastSyncTime && (
                    <p className={styles.lastSync}>
                      마지막 동기화:{" "}
                      {syncState.lastSyncTime.toLocaleString("ko-KR")}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.settings}>
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

              <button
                className={styles.disconnectButton}
                onClick={handleDisconnect}
                disabled={isLoading}
              >
                <FiLogOut />
                연동 해제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
