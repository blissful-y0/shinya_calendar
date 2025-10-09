import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { updateStatusState } from "@store/atoms";
import styles from "./UpdateNotification.module.scss";

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export default function UpdateNotification() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const setUpdateStatus = useSetRecoilState(updateStatusState);

  useEffect(() => {
    // Electron 환경이 아니면 아무것도 하지 않음
    if (!window.electronAPI?.autoUpdater) {
      return;
    }

    // 업데이트 확인 중
    const removeCheckingListener =
      window.electronAPI.autoUpdater.onCheckingForUpdate(() => {
        setStatus("checking");
        setDismissed(false);
      });

    // 업데이트 사용 가능
    const removeAvailableListener =
      window.electronAPI.autoUpdater.onUpdateAvailable((info: UpdateInfo) => {
        setStatus("available");
        setUpdateInfo(info);
        setDismissed(false);
        // 전역 상태 업데이트
        setUpdateStatus({
          hasUpdate: true,
          version: info.version,
          isDownloading: false,
          isDownloaded: false,
        });
      });

    // 업데이트 없음 - 3초간 메시지 표시
    const removeNotAvailableListener =
      window.electronAPI.autoUpdater.onUpdateNotAvailable(() => {
        setStatus("not-available");
        setDismissed(false);
        // 전역 상태 업데이트
        setUpdateStatus({
          hasUpdate: false,
        });
        // 3초 후 자동으로 숨김
        setTimeout(() => {
          setStatus("idle");
          setDismissed(true);
        }, 3000);
      });

    // 다운로드 진행
    const removeProgressListener =
      window.electronAPI.autoUpdater.onDownloadProgress(
        (progressInfo: DownloadProgress) => {
          setStatus("downloading");
          setProgress(progressInfo);
          // 전역 상태 업데이트
          setUpdateStatus((prev) => ({
            ...prev,
            isDownloading: true,
            isDownloaded: false,
          }));
        }
      );

    // 다운로드 완료
    const removeDownloadedListener =
      window.electronAPI.autoUpdater.onUpdateDownloaded((info: UpdateInfo) => {
        setStatus("downloaded");
        setUpdateInfo(info);
        setProgress(null);
        // 전역 상태 업데이트
        setUpdateStatus({
          hasUpdate: true,
          version: info.version,
          isDownloading: false,
          isDownloaded: true,
        });
      });

    // 에러
    const removeErrorListener = window.electronAPI.autoUpdater.onUpdateError(
      (err: { message: string }) => {
        setStatus("error");
        setError(err.message);
        // 5초 후 자동으로 숨김
        setTimeout(() => setDismissed(true), 5000);
      }
    );

    // 클린업
    return () => {
      removeCheckingListener();
      removeAvailableListener();
      removeNotAvailableListener();
      removeProgressListener();
      removeDownloadedListener();
      removeErrorListener();
    };
  }, []);

  const handleDownload = async () => {
    if (!window.electronAPI?.autoUpdater) return;

    try {
      await window.electronAPI.autoUpdater.downloadUpdate();
    } catch (err) {
      console.error("Failed to download update:", err);
    }
  };

  const handleInstall = async () => {
    if (!window.electronAPI?.autoUpdater) return;

    try {
      await window.electronAPI.autoUpdater.installUpdate();
    } catch (err) {
      console.error("Failed to install update:", err);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // 표시하지 않을 상태
  if (dismissed || status === "idle" || !window.electronAPI?.autoUpdater) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + "/s";
  };

  return (
    <div className={styles.container}>
      {status === "checking" && (
        <div className={styles.notification}>
          <div className={styles.content}>
            <span className={styles.spinner} />
            <span>업데이트 확인 중...</span>
          </div>
        </div>
      )}

      {status === "not-available" && (
        <div className={styles.notification}>
          <div className={styles.content}>
            <div className={styles.icon}>✓</div>
            <div className={styles.text}>
              <strong>최신 버전 사용 중</strong>
              <p>현재 사용 중인 버전이 최신입니다.</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={handleDismiss}>
            ×
          </button>
        </div>
      )}

      {status === "available" && updateInfo && (
        <div className={styles.notification}>
          <div className={styles.content}>
            <div className={styles.icon}>🎉</div>
            <div className={styles.text}>
              <strong>새 버전 사용 가능</strong>
              <p>버전 {updateInfo.version}이(가) 출시되었습니다.</p>
            </div>
          </div>
          <div className={styles.actions}>
            <button className={styles.buttonSecondary} onClick={handleDismiss}>
              나중에
            </button>
            <button className={styles.buttonPrimary} onClick={handleDownload}>
              다운로드
            </button>
          </div>
        </div>
      )}

      {status === "downloading" && progress && (
        <div className={styles.notification}>
          <div className={styles.content}>
            <div className={styles.text}>
              <strong>업데이트 다운로드 중...</strong>
              <p>
                {Math.round(progress.percent)}% -{" "}
                {formatSpeed(progress.bytesPerSecond)}
              </p>
            </div>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {status === "downloaded" && updateInfo && (
        <div className={styles.notification}>
          <div className={styles.content}>
            <div className={styles.icon}>✅</div>
            <div className={styles.text}>
              <strong>업데이트 준비 완료</strong>
              <p>버전 {updateInfo.version}을(를) 설치할 수 있습니다.</p>
            </div>
          </div>
          <div className={styles.actions}>
            <button className={styles.buttonSecondary} onClick={handleDismiss}>
              나중에
            </button>
            <button className={styles.buttonPrimary} onClick={handleInstall}>
              지금 설치
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className={`${styles.notification} ${styles.error}`}>
          <div className={styles.content}>
            <div className={styles.text}>
              <strong>업데이트 확인 실패</strong>
              <p>{error || "알 수 없는 오류"}</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={handleDismiss}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
