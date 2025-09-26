import React, { useState, useRef } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { stickersState, stickerEditModeState } from '@store/atoms';
import { MdAdd, MdDelete, MdPhoto, MdLock } from 'react-icons/md';
import { v4 as uuidv4 } from 'uuid';
import styles from './StickerPanel.module.scss';

export interface Sticker {
  id: string;
  image: string;
  x: number; // 퍼센트 값 (0-100)
  y: number; // 퍼센트 값 (0-100)
  width: number; // 퍼센트 값 (0-100)
  height: number; // 퍼센트 값 (0-100)
  zIndex: number;
  name: string;
  rotation: number; // 회전 각도 (degrees)
}

export interface StickerLayout {
  id: string;
  name: string;
  resolution: {
    width: number;
    height: number;
  };
  stickers: Sticker[];
  savedAt: Date;
}

export interface UploadedStickerTemplate {
  id: string;
  image: string;
  name: string;
  width: number;
  height: number;
}

const StickerPanel: React.FC = () => {
  const [stickers, setStickers] = useRecoilState(stickersState);
  const stickerEditMode = useRecoilValue(stickerEditModeState);
  const [uploadedStickers, setUploadedStickers] = useState<Omit<Sticker, 'x' | 'y' | 'width' | 'height' | 'zIndex' | 'rotation'>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const newSticker = {
          id: uuidv4(),
          image: result,
          name: file.name
        };
        setUploadedStickers(prev => [...prev, newSticker]);
      };
      reader.readAsDataURL(file);
    }
  };

  const addStickerToCanvas = (uploadedSticker: Omit<Sticker, 'x' | 'y' | 'zIndex' | 'rotation' | 'width' | 'height'>) => {
    const newSticker: Sticker = {
      id: uuidv4(),
      image: uploadedSticker.image,
      name: uploadedSticker.name,
      x: 50 - 7.5, // 중앙 위치 (50% - width/2)
      y: 50 - 7.5, // 중앙 위치 (50% - height/2)
      width: 15, // 화면 너비의 15%
      height: 15, // 화면 너비의 15% (비율 유지)
      zIndex: Date.now(),
      rotation: 0
    };
    setStickers(prev => [...prev, newSticker]);
  };

  const removeUploadedSticker = (id: string) => {
    setUploadedStickers(prev => prev.filter(s => s.id !== id));
    setStickers(prev => prev.filter(s => s.id !== id));
  };

  const clearAllStickers = () => {
    if (confirm('모든 스티커를 제거하시겠습니까?')) {
      setStickers([]);
    }
  };

  return (
    <div className={styles.stickerPanel}>
      {!stickerEditMode && (
        <div className={styles.modeAlert}>
          <MdLock />
          <span>편집 모드를 활성화해야 스티커를 업로드하고 편집할 수 있습니다.</span>
        </div>
      )}

      <div className={`${styles.section} ${!stickerEditMode ? styles.disabled : ''}`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>스티커 업로드</h3>
          <button
            className={styles.uploadButton}
            onClick={() => stickerEditMode && fileInputRef.current?.click()}
            disabled={!stickerEditMode}
          >
            <MdAdd />
            이미지 추가
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
          multiple
        />

        <div className={styles.stickerGrid}>
          {uploadedStickers.length === 0 ? (
            <div className={styles.emptyState}>
              <MdPhoto className={styles.emptyIcon} />
              <p>업로드된 스티커가 없습니다</p>
              <span>이미지를 추가해보세요</span>
            </div>
          ) : (
            uploadedStickers.map(sticker => (
              <div key={sticker.id} className={`${styles.stickerItem} ${!stickerEditMode ? styles.disabled : ''}`}>
                <div
                  className={styles.stickerPreview}
                  style={{ backgroundImage: `url(${sticker.image})` }}
                  onClick={() => stickerEditMode && addStickerToCanvas(sticker)}
                  title={stickerEditMode ? '캔버스에 추가' : '편집 모드에서만 사용 가능'}
                />
                <div className={styles.stickerActions}>
                  <span className={styles.stickerName}>
                    {sticker.name.length > 12
                      ? `${sticker.name.slice(0, 12)}...`
                      : sticker.name
                    }
                  </span>
                  <button
                    className={styles.deleteButton}
                    onClick={() => stickerEditMode && removeUploadedSticker(sticker.id)}
                    disabled={!stickerEditMode}
                    title="삭제"
                  >
                    <MdDelete />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`${styles.section} ${!stickerEditMode ? styles.disabled : ''}`}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>캔버스 관리</h3>
          <button
            className={styles.clearButton}
            onClick={() => stickerEditMode && clearAllStickers()}
            disabled={stickers.length === 0 || !stickerEditMode}
          >
            전체 제거
          </button>
        </div>

        <div className={styles.info}>
          <p>현재 캔버스에 {stickers.length}개의 스티커가 배치되어 있습니다.</p>
          <p className={styles.hint}>
            • 스티커를 클릭하면 캔버스에 추가됩니다<br/>
            • 캔버스에서 스티커를 드래그하여 위치를 조정하세요<br/>
            • 스티커를 더블클릭하면 크기를 조정할 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default StickerPanel;