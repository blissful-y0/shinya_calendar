import React, { useState, useEffect } from "react";
import { useRecoilState, useSetRecoilState, useRecoilValue } from "recoil";
import {
  stickerEditModeState,
  modalActiveState,
  stickersState,
  stickerLayoutsState,
  uploadedStickersState,
  stickerVisibilityState,
  sidebarPositionState,
  bannerImagesState,
  carouselSettingsState,
  BannerImage,
} from "@store/atoms";
import {
  MdBrush,
  MdClose,
  MdImage,
  MdEdit,
  MdEditOff,
  MdDelete,
  MdRestore,
  MdMoreVert,
  MdViewSidebar,
  MdPhotoLibrary,
  MdArrowUpward,
  MdArrowDownward,
} from "react-icons/md";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { StickerLayout } from "./StickerPanel";
import ThemeSelector from "../Theme/ThemeSelector";
import styles from "./StylingManager.module.scss";

interface StylingManagerProps {
  onClose: () => void;
}

type StylingMode = "sticker" | "theme" | "sidebar" | "banner";

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
  const [sidebarPosition, setSidebarPosition] =
    useRecoilState(sidebarPositionState);
  const [bannerImages, setBannerImages] = useRecoilState(bannerImagesState);
  const [carouselSettings, setCarouselSettings] = useRecoilState(
    carouselSettingsState
  );

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

  const moveBannerUp = (index: number) => {
    if (index === 0) return;
    const newBanners = [...bannerImages];
    [newBanners[index - 1], newBanners[index]] = [
      newBanners[index],
      newBanners[index - 1],
    ];
    // 순서 업데이트
    const reordered = newBanners.map((banner, idx) => ({
      ...banner,
      order: idx,
    }));
    setBannerImages(reordered);
  };

  const moveBannerDown = (index: number) => {
    if (index === bannerImages.length - 1) return;
    const newBanners = [...bannerImages];
    [newBanners[index + 1], newBanners[index]] = [
      newBanners[index],
      newBanners[index + 1],
    ];
    // 순서 업데이트
    const reordered = newBanners.map((banner, idx) => ({
      ...banner,
      order: idx,
    }));
    setBannerImages(reordered);
  };

  const removeBanner = (id: string) => {
    if (confirm("이 배너를 삭제하시겠습니까?")) {
      const filtered = bannerImages.filter((b) => b.id !== id);
      const reordered = filtered.map((banner, idx) => ({
        ...banner,
        order: idx,
      }));
      setBannerImages(reordered);
    }
  };

  // 정렬된 배너 목록
  const sortedBanners = [...bannerImages].sort((a, b) => a.order - b.order);

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
          <button
            className={`${styles.tab} ${
              activeMode === "sidebar" ? styles.active : ""
            }`}
            onClick={() => setActiveMode("sidebar")}
          >
            <MdViewSidebar />
            사이드바
          </button>
          <button
            className={`${styles.tab} ${
              activeMode === "banner" ? styles.active : ""
            }`}
            onClick={() => setActiveMode("banner")}
          >
            <MdPhotoLibrary />
            배너
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
          {activeMode === "sidebar" && (
            <div className={styles.sidebarContent}>
              <div className={styles.sectionHeader}>
                <h3>사이드바 위치</h3>
              </div>

              <div className={styles.positionSelector}>
                <button
                  className={`${styles.positionButton} ${
                    sidebarPosition === "left" ? styles.active : ""
                  }`}
                  onClick={() => setSidebarPosition("left")}
                >
                  <MdViewSidebar style={{ transform: "scaleX(-1)" }} />
                  <span>왼쪽</span>
                </button>
                <button
                  className={`${styles.positionButton} ${
                    sidebarPosition === "right" ? styles.active : ""
                  }`}
                  onClick={() => setSidebarPosition("right")}
                >
                  <MdViewSidebar />
                  <span>오른쪽</span>
                </button>
              </div>
            </div>
          )}
          {activeMode === "banner" && (
            <div className={styles.bannerContent}>
              <div className={styles.sectionHeader}>
                <h3>배너 이미지 관리</h3>
                <div className={styles.bannerCount}>
                  {bannerImages.length}/5개
                </div>
              </div>

              {sortedBanners.length > 0 ? (
                <div className={styles.bannerList}>
                  {sortedBanners.map((banner, index) => (
                    <div key={banner.id} className={styles.bannerItem}>
                      <div
                        className={styles.bannerPreview}
                        style={{ backgroundImage: `url(${banner.image})` }}
                      />
                      <div className={styles.bannerInfo}>
                        <span className={styles.bannerOrder}>
                          배너 {index + 1}
                        </span>
                      </div>
                      <div className={styles.bannerActions}>
                        <button
                          className={styles.moveButton}
                          onClick={() => moveBannerUp(index)}
                          disabled={index === 0}
                          title="위로 이동"
                        >
                          <MdArrowUpward />
                        </button>
                        <button
                          className={styles.moveButton}
                          onClick={() => moveBannerDown(index)}
                          disabled={index === sortedBanners.length - 1}
                          title="아래로 이동"
                        >
                          <MdArrowDownward />
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => removeBanner(banner.id)}
                          title="삭제"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyBanner}>
                  <MdPhotoLibrary />
                  <p>배너가 없습니다</p>
                  <p className={styles.hint}>
                    상단의 배너 영역을 클릭하여 추가하세요
                  </p>
                </div>
              )}

              <div className={styles.carouselSettings}>
                <div className={styles.sectionHeader}>
                  <h3>배너 설정</h3>
                </div>

                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>
                    <input
                      type="checkbox"
                      checked={carouselSettings.autoplay}
                      onChange={(e) =>
                        setCarouselSettings({
                          ...carouselSettings,
                          autoplay: e.target.checked,
                        })
                      }
                    />
                    <span>자동 재생</span>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>전환 속도</label>
                  <div className={styles.sliderContainer}>
                    <input
                      type="range"
                      min="300"
                      max="1500"
                      step="100"
                      value={carouselSettings.speed}
                      onChange={(e) =>
                        setCarouselSettings({
                          ...carouselSettings,
                          speed: Number(e.target.value),
                        })
                      }
                      className={styles.slider}
                    />
                    <span className={styles.sliderValue}>
                      {carouselSettings.speed}ms
                    </span>
                  </div>
                </div>

                <div className={styles.settingItem}>
                  <label className={styles.settingLabel}>자동 재생 간격</label>
                  <div className={styles.sliderContainer}>
                    <input
                      type="range"
                      min="1000"
                      max="10000"
                      step="500"
                      value={carouselSettings.delay}
                      onChange={(e) =>
                        setCarouselSettings({
                          ...carouselSettings,
                          delay: Number(e.target.value),
                        })
                      }
                      className={styles.slider}
                      disabled={!carouselSettings.autoplay}
                    />
                    <span className={styles.sliderValue}>
                      {carouselSettings.delay / 1000}초
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StylingManager;
