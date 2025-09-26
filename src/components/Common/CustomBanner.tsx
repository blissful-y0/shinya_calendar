import React, { useState, useRef, useEffect } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import { bannerImageState, stickerEditModeState } from "@store/atoms";
import { MdPhoto, MdClose, MdCrop } from "react-icons/md";
import BannerCropModal from "./BannerCropModal";
import styles from "./CustomBanner.module.scss";

const CustomBanner: React.FC = () => {
  const [bannerImage, setBannerImage] = useRecoilState(bannerImageState);
  const setStickerEditMode = useSetRecoilState(stickerEditModeState);
  const [isHovered, setIsHovered] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 크롭 모달이 열릴 때 스티커 편집 모드 비활성화
  useEffect(() => {
    if (showCropModal) {
      setStickerEditMode(false);
    }
  }, [showCropModal, setStickerEditMode]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setTempImage(result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!bannerImage) {
      fileInputRef.current?.click();
    }
  };

  const handleCropImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bannerImage) {
      setTempImage(bannerImage);
      setShowCropModal(true);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setBannerImage(croppedImage);
    setShowCropModal(false);
    setTempImage(null);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setTempImage(null);
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBannerImage(null);
  };

  return (
    <div
      className={styles.bannerContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {bannerImage ? (
        <>
          <div
            className={styles.banner}
            style={{ backgroundImage: `url(${bannerImage})` }}
          >
            <div className={styles.overlay}></div>
          </div>
          {isHovered && (
            <div className={styles.controls}>
              <button
                className={styles.changeButton}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                title="이미지 변경"
              >
                <MdPhoto />
              </button>
              <button
                className={styles.removeButton}
                onClick={handleRemoveImage}
                title="이미지 제거"
              >
                <MdClose />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.uploadPrompt}>
          <div className={styles.uploadIcon}></div>
          <div className={styles.uploadText}>클릭하여 배너 이미지를 추가</div>
          <div className={styles.uploadHint}>권장 크기: 1200 x 400px</div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />
      {showCropModal && tempImage && (
        <BannerCropModal
          imageSrc={tempImage}
          onCropComplete={handleCropComplete}
          onClose={handleCropCancel}
        />
      )}
    </div>
  );
};

export default CustomBanner;
