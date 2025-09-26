import React, { useState, useEffect } from "react";
import { useRecoilState, useSetRecoilState, useRecoilValue } from "recoil";
import {
  stickerEditModeState,
  modalActiveState,
  stickersState,
  stickerLayoutsState,
  uploadedStickersState,
  stickerVisibilityState,
} from "@store/atoms";
import {
  MdBrush,
  MdClose,
  MdImage,
  MdEdit,
  MdEditOff,
  MdDelete,
  MdPhotoLibrary,
  MdRestore,
  MdFolder,
  MdMoreVert,
} from "react-icons/md";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { StickerLayout } from "./StickerPanel";
import ThemeSelector from "../Theme/ThemeSelector";
import styles from "./StylingManager.module.scss";

interface StylingManagerProps {
  onClose: () => void;
}

type StylingMode = "sticker" | "theme";

const StylingManager: React.FC<StylingManagerProps> = ({ onClose }) => {
  const [activeMode, setActiveMode] = useState<StylingMode>("sticker");
  const [stickerEditMode, setStickerEditMode] =
    useRecoilState(stickerEditModeState);
  const stickers = useRecoilValue(stickersState);
  const setStickers = useSetRecoilState(stickersState);
  const setModalActive = useSetRecoilState(modalActiveState);
  const [stickerLayouts, setStickerLayouts] =
    useRecoilState(stickerLayoutsState);
  const [uploadedStickers, setUploadedStickers] = useRecoilState(
    uploadedStickersState
  );
  const [layoutMenuId, setLayoutMenuId] = useState<string | null>(null);
  const setStickerVisibility = useSetRecoilState(stickerVisibilityState);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 모달 마운트/언마운트 시 모달 상태 관리
  useEffect(() => {
    setModalActive(true);
    return () => setModalActive(false);
  }, [setModalActive]);

  const toggleStickerEditMode = () => {
    setStickerEditMode(!stickerEditMode);
    // 편집 시작 시 스타일링 매니저 창 닫기 및 스티커 표시 강제 활성화
    if (!stickerEditMode) {
      setStickerVisibility(true); // 편집 모드 시작 시 스티커 표시 강제로 켜기
      onClose();
    }
  };

  const handleClearAllStickers = () => {
    if (
      confirm("모든 스티커를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")
    ) {
      setStickers([]);
    }
  };

  const applyLayout = async (layout: StickerLayout) => {
    const confirmMessage = `"${layout.name}" 레이아웃을 적용하시겠습니까?\n현재 스티커들은 사라지고, 해상도가 ${layout.resolution.width}×${layout.resolution.height}으로 변경됩니다.`;

    if (confirm(confirmMessage)) {
      try {
        // Electron의 창 크기 변경
        if (window.electronAPI && window.electronAPI.resizeWindow) {
          await window.electronAPI.resizeWindow(
            layout.resolution.width,
            layout.resolution.height
          );
        }

        // 스티커 적용
        setStickers([...layout.stickers]);
        setLayoutMenuId(null);
      } catch (error) {
        console.error("Failed to resize window:", error);
        alert("해상도 변경에 실패했습니다.");
      }
    }
  };

  const deleteLayout = (layoutId: string) => {
    const layout = stickerLayouts.find((l) => l.id === layoutId);
    if (layout && confirm(`"${layout.name}" 레이아웃을 삭제하시겠습니까?`)) {
      setStickerLayouts((prev) => prev.filter((l) => l.id !== layoutId));
      setLayoutMenuId(null);
    }
  };

  const removeUploadedSticker = (id: string) => {
    if (confirm("이 스티커를 삭제하시겠습니까?")) {
      setUploadedStickers((prev) => prev.filter((s) => s.id !== id));
      // 캔버스에서도 같은 스티커 제거
      setStickers((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>스타일 관리</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeMode === "sticker" ? styles.active : ""
            }`}
            onClick={() => setActiveMode("sticker")}
          >
            <MdImage />
            스티커
          </button>
          <button
            className={`${styles.tab} ${
              activeMode === "theme" ? styles.active : ""
            }`}
            onClick={() => setActiveMode("theme")}
          >
            <MdBrush />
            테마
          </button>
        </div>

        <div className={styles.content}>
          {activeMode === "sticker" && (
            <div className={styles.stickerContent}>
              <div className={styles.infoSection}>
                <div className={styles.canvasInfo}>
                  <div className={styles.canvasHeader}>
                    <h3>캔버스 관리</h3>
                    <button
                      className={`${styles.editModeToggle} ${
                        stickerEditMode ? styles.active : ""
                      }`}
                      onClick={toggleStickerEditMode}
                      title={
                        stickerEditMode ? "편집 모드 끄기" : "편집 모드 켜기"
                      }
                    >
                      {stickerEditMode ? <MdEditOff /> : <MdEdit />}
                      {stickerEditMode ? "편집 종료" : "편집 시작"}
                    </button>
                  </div>

                  <p>
                    현재 캔버스에 {stickers.length}개의 스티커가 배치되어
                    있습니다.
                  </p>

                  {!stickerEditMode && (
                    <p className={styles.hint}>
                      편집 시작을 누르면 하단에 툴바가 나타납니다.
                    </p>
                  )}

                  <div className={styles.canvasActions}>
                    <button
                      className={styles.clearAllButton}
                      onClick={handleClearAllStickers}
                      disabled={stickers.length === 0}
                    >
                      전체 삭제
                    </button>
                  </div>
                </div>
              </div>

              {stickerLayouts.length > 0 && (
                <div className={styles.layoutsSection}>
                  <div className={styles.sectionHeader}>
                    <h3>저장된 레이아웃</h3>
                  </div>

                  <div className={styles.layoutsList}>
                    {stickerLayouts.map((layout) => (
                      <div key={layout.id} className={styles.layoutItem}>
                        <div className={styles.layoutInfo}>
                          <div className={styles.layoutName}>{layout.name}</div>
                          <div className={styles.layoutMeta}>
                            <span className={styles.stickerCount}>
                              스티커 {layout.stickers.length}개
                            </span>
                            <span className={styles.resolution}>
                              {layout.resolution.width} ×{" "}
                              {layout.resolution.height}
                            </span>
                            <span className={styles.saveDate}>
                              {format(layout.savedAt, "MM/dd HH:mm", {
                                locale: ko,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className={styles.layoutActions}>
                          <button
                            className={styles.applyButton}
                            onClick={() => applyLayout(layout)}
                            title="이 레이아웃 적용"
                          >
                            <MdRestore />
                            적용
                          </button>
                          <div className={styles.layoutMenu}>
                            <button
                              className={styles.menuButton}
                              onClick={() =>
                                setLayoutMenuId(
                                  layoutMenuId === layout.id ? null : layout.id
                                )
                              }
                              title="더보기"
                            >
                              <MdMoreVert />
                            </button>
                            {layoutMenuId === layout.id && (
                              <div className={styles.menuDropdown}>
                                <button
                                  className={styles.deleteMenuItem}
                                  onClick={() => deleteLayout(layout.id)}
                                >
                                  <MdDelete />
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadedStickers.length > 0 && (
                <div className={styles.assetsSection}>
                  <div className={styles.sectionHeader}>
                    <h3>스티커 에셋</h3>
                    <div className={styles.assetCount}>
                      {uploadedStickers.length}개 보유
                    </div>
                  </div>

                  <div className={styles.assetGrid}>
                    {uploadedStickers.map((sticker) => (
                      <div key={sticker.id} className={styles.assetItem}>
                        <div
                          className={styles.assetPreview}
                          style={{ backgroundImage: `url(${sticker.image})` }}
                          title={sticker.name}
                        />
                        <div className={styles.assetInfo}>
                          <span className={styles.assetName}>
                            {sticker.name.length > 10
                              ? `${sticker.name.slice(0, 10)}...`
                              : sticker.name}
                          </span>
                          <button
                            className={styles.assetDeleteButton}
                            onClick={() => removeUploadedSticker(sticker.id)}
                            title="스티커 삭제"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeMode === "theme" && (
            <div className={styles.themeContent}>
              <ThemeSelector />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StylingManager;
