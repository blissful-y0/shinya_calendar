import React, { useState, useRef } from "react";
import { useRecoilState } from "recoil";
import { bannerImageState } from "@store/atoms";
import styles from "./CustomBanner.module.scss";

const CustomBanner: React.FC = () => {
  const [bannerImage, setBannerImage] = useRecoilState(bannerImageState);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBannerImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
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
                onClick={handleClick}
                title="이미지 변경"
              >
                <span>🖼️</span>
              </button>
              <button
                className={styles.removeButton}
                onClick={handleRemoveImage}
                title="이미지 제거"
              >
                <span>✕</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.uploadPrompt}>
          <div className={styles.uploadIcon}></div>
          <div className={styles.uploadText}>클릭하여 배너 이미지를 추가</div>
          <div className={styles.uploadHint}>권장 크기: 1200 x 200px</div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default CustomBanner;
