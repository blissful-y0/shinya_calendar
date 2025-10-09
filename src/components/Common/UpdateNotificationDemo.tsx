import { useState } from "react";
import { useSetRecoilState } from "recoil";
import { updateStatusState } from "@store/atoms";

/**
 * 업데이트 기능 테스트를 위한 데모 컴포넌트
 * 개발 환경에서만 표시되며, 다양한 업데이트 상태를 시뮬레이션할 수 있습니다.
 */
export default function UpdateNotificationDemo() {
  const setUpdateStatus = useSetRecoilState(updateStatusState);
  const [isOpen, setIsOpen] = useState(false);

  const simulateUpdateAvailable = () => {
    setUpdateStatus({
      hasUpdate: true,
      version: "1.2.0",
      isDownloading: false,
      isDownloaded: false,
    });
  };

  const simulateDownloading = () => {
    setUpdateStatus({
      hasUpdate: true,
      version: "1.2.0",
      isDownloading: true,
      isDownloaded: false,
    });
  };

  const simulateDownloaded = () => {
    setUpdateStatus({
      hasUpdate: true,
      version: "1.2.0",
      isDownloading: false,
      isDownloaded: true,
    });
  };

  const simulateNoUpdate = () => {
    setUpdateStatus({
      hasUpdate: false,
    });
  };

  const resetState = () => {
    setUpdateStatus({
      hasUpdate: false,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "24px",
        zIndex: 10000,
        backgroundColor: "#1f2937",
        color: "white",
        borderRadius: "12px",
        padding: isOpen ? "16px" : "12px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        minWidth: isOpen ? "280px" : "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ fontSize: "14px", fontWeight: "600" }}>
          🧪 Update Test
        </span>
        <span style={{ fontSize: "12px", marginLeft: "8px" }}>
          {isOpen ? "▼" : "▲"}
        </span>
      </div>

      {isOpen && (
        <div
          style={{
            marginTop: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <button
            onClick={simulateUpdateAvailable}
            style={{
              padding: "8px 12px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            업데이트 사용 가능
          </button>

          <button
            onClick={simulateDownloading}
            style={{
              padding: "8px 12px",
              backgroundColor: "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            다운로드 중
          </button>

          <button
            onClick={simulateDownloaded}
            style={{
              padding: "8px 12px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            다운로드 완료
          </button>

          <button
            onClick={simulateNoUpdate}
            style={{
              padding: "8px 12px",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            업데이트 없음
          </button>

          <button
            onClick={resetState}
            style={{
              padding: "8px 12px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            상태 초기화
          </button>

          <div
            style={{
              marginTop: "8px",
              padding: "8px",
              backgroundColor: "#374151",
              borderRadius: "6px",
              fontSize: "11px",
            }}
          >
            <p style={{ margin: "0 0 4px 0", fontWeight: "600" }}>설명:</p>
            <ul style={{ margin: 0, paddingLeft: "16px", lineHeight: "1.6" }}>
              <li>Header 버전 배지의 빨간 점(●) 확인</li>
              <li>UpdateNotification 팝업 확인</li>
              <li>각 상태 간 전환 테스트</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
