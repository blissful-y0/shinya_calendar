import React, { useState, useRef } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  bannerImagesState,
  carouselSettingsState,
  stickerEditModeState,
  BannerImage,
} from "@store/atoms";
import { MdPhoto, MdClose, MdCrop } from "react-icons/md";
import BannerCropModal from "./BannerCropModal";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { v4 as uuidv4 } from "uuid";

// Swiper 스타일 import
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import styles from "./CarouselBanner.module.scss";

const CarouselBanner: React.FC = () => {
  const [bannerImages, setBannerImages] = useRecoilState(bannerImagesState);
  const [carouselSettings] = useRecoilState(carouselSettingsState);
  const setStickerEditMode = useSetRecoilState(stickerEditModeState);
  const [isHovered, setIsHovered] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_BANNERS = 5;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (bannerImages.length >= MAX_BANNERS) {
        alert(`최대 ${MAX_BANNERS}개의 배너만 추가할 수 있습니다.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setTempImage(result);
        setEditingImageId(null); // 새 이미지 추가
        setShowCropModal(true);
        setStickerEditMode(false);
      };
      reader.readAsDataURL(file);
    }
    // Reset input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (bannerImages.length === 0) {
      fileInputRef.current?.click();
    }
  };

  const handleCropImage = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    const image = bannerImages.find((img) => img.id === imageId);
    if (image) {
      setTempImage(image.image);
      setEditingImageId(imageId);
      setShowCropModal(true);
      setStickerEditMode(false);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    if (editingImageId) {
      // 기존 이미지 수정
      setBannerImages((prev) =>
        prev.map((img) =>
          img.id === editingImageId ? { ...img, image: croppedImage } : img
        )
      );
    } else {
      // 새 이미지 추가
      const newImage: BannerImage = {
        id: uuidv4(),
        image: croppedImage,
        order: bannerImages.length,
      };
      setBannerImages((prev) => [...prev, newImage]);
    }
    setShowCropModal(false);
    setTempImage(null);
    setEditingImageId(null);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setTempImage(null);
    setEditingImageId(null);
  };

  const handleRemoveImage = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    setBannerImages((prev) => {
      const filtered = prev.filter((img) => img.id !== imageId);
      // 순서 재정렬
      return filtered.map((img, index) => ({ ...img, order: index }));
    });
  };

  const handleAddMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bannerImages.length < MAX_BANNERS) {
      fileInputRef.current?.click();
    }
  };

  // 순서대로 정렬된 배너 이미지
  const sortedBanners = [...bannerImages].sort((a, b) => a.order - b.order);

  return (
    <div
      className={styles.bannerContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {bannerImages.length > 0 ? (
        <>
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={0}
            slidesPerView={1}
            autoplay={
              carouselSettings.autoplay
                ? {
                    delay: carouselSettings.delay,
                    disableOnInteraction: false,
                  }
                : false
            }
            speed={carouselSettings.speed}
            pagination={false}
            navigation={sortedBanners.length > 1}
            loop={sortedBanners.length > 1}
            className={styles.swiper}
          >
            {sortedBanners.map((banner) => (
              <SwiperSlide key={banner.id}>
                <div
                  className={styles.banner}
                  style={{ backgroundImage: `url(${banner.image})` }}
                >
                  <div className={styles.overlay}></div>
                  {isHovered && (
                    <div className={styles.slideControls}>
                      <button
                        className={styles.cropButton}
                        onClick={(e) => handleCropImage(e, banner.id)}
                        title="이미지 자르기"
                      >
                        <MdCrop />
                      </button>
                      <button
                        className={styles.removeButton}
                        onClick={(e) => handleRemoveImage(e, banner.id)}
                        title="이미지 제거"
                      >
                        <MdClose />
                      </button>
                    </div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {isHovered && bannerImages.length < MAX_BANNERS && (
            <div className={styles.globalControls}>
              <button
                className={styles.addButton}
                onClick={handleAddMore}
                title="배너 추가"
              >
                <MdPhoto />
                배너 추가 ({bannerImages.length}/{MAX_BANNERS})
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.uploadPrompt}>
          <div className={styles.uploadIcon}></div>
          <div className={styles.uploadText}>클릭하여 배너 이미지를 추가</div>
          <div className={styles.uploadHint}>
            최대 {MAX_BANNERS}개까지 추가 가능 · 권장 크기: 1200 x 200px
          </div>
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

export default CarouselBanner;
