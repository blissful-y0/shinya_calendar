import React, { useState, useRef } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { stickersState, uploadedStickersState, stickerLayoutsState } from '@store/atoms';
import { MdAdd, MdSave, MdPhoto, MdClose, MdCheck, MdUndo } from 'react-icons/md';
import { v4 as uuidv4 } from 'uuid';
import { UploadedStickerTemplate, StickerLayout } from './StickerPanel';
import styles from './FloatingToolbar.module.scss';

interface FloatingToolbarProps {
  onClose: () => void;
  onCancel: () => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ onClose, onCancel }) => {
  const [stickers, setStickers] = useRecoilState(stickersState);
  const [uploadedStickers, setUploadedStickers] = useRecoilState(uploadedStickersState);
  const [stickerLayouts, setStickerLayouts] = useRecoilState(stickerLayoutsState);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCurrentResolution = () => ({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const handleMultipleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const newTemplate: UploadedStickerTemplate = {
            id: uuidv4(),
            image: result,
            name: file.name,
            width: 100,
            height: 100
          };
          setUploadedStickers(prev => [...prev, newTemplate]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const addStickerToCanvas = (template: UploadedStickerTemplate) => {
    const newSticker = {
      ...template,
      id: uuidv4(),
      x: Math.random() * 200 + 50,
      y: Math.random() * 200 + 50,
      zIndex: Date.now(),
      rotation: 0
    };
    setStickers(prev => [...prev, newSticker]);
  };

  const handleSaveAndCompleteClick = () => {
    setLayoutName(`레이아웃 ${new Date().toLocaleString('ko-KR')}`);
    setShowSaveDialog(true);
  };

  const saveAndComplete = () => {
    if (!layoutName.trim()) return;

    const currentResolution = getCurrentResolution();

    const newLayout: StickerLayout = {
      id: uuidv4(),
      name: layoutName.trim(),
      resolution: currentResolution,
      stickers: [...stickers],
      savedAt: new Date()
    };

    setStickerLayouts(prev => [...prev, newLayout]);
    setShowSaveDialog(false);
    setLayoutName('');
    alert('레이아웃이 저장되었습니다!');

    // 저장 완료 후 편집 모드 종료
    onClose();
  };

  const cancelSave = () => {
    setShowSaveDialog(false);
    setLayoutName('');
  };

  const removeUploadedSticker = (id: string) => {
    setUploadedStickers(prev => prev.filter(s => s.id !== id));
  };

  return (
    <>
      <div className={styles.floatingToolbar}>
        <div className={styles.toolbarContent}>
          <button
            className={styles.toolButton}
            onClick={() => setShowUploadPanel(!showUploadPanel)}
            title="스티커 업로드"
          >
            <MdAdd />
            업로드
          </button>

          <button
            className={styles.saveCompleteButton}
            onClick={handleSaveAndCompleteClick}
            title="레이아웃 저장 후 꾸미기 완료"
          >
            <MdSave />
            저장 후 완료
          </button>

          <button
            className={styles.cancelButton}
            onClick={onCancel}
            title="꾸미기 취소 (이전 상태로 되돌리기)"
          >
            <MdUndo />
            취소
          </button>
        </div>
      </div>

      {showUploadPanel && (
        <div className={styles.uploadPanel}>
          <div className={styles.uploadHeader}>
            <h4>스티커 업로드</h4>
            <button
              className={styles.uploadButton}
              onClick={() => fileInputRef.current?.click()}
            >
              <MdPhoto />
              이미지 선택 (다중)
            </button>
          </div>

          <div className={styles.stickerGrid}>
            {uploadedStickers.length === 0 ? (
              <div className={styles.emptyState}>
                <MdPhoto />
                <p>업로드된 스티커가 없습니다</p>
              </div>
            ) : (
              uploadedStickers.map(template => (
                <div key={template.id} className={styles.stickerItem}>
                  <div
                    className={styles.stickerPreview}
                    style={{ backgroundImage: `url(${template.image})` }}
                    onClick={() => addStickerToCanvas(template)}
                    title="캔버스에 추가"
                  />
                  <div className={styles.stickerInfo}>
                    <span className={styles.stickerName}>
                      {template.name.length > 12
                        ? `${template.name.slice(0, 12)}...`
                        : template.name}
                    </span>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeUploadedSticker(template.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleMultipleImageUpload}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {showSaveDialog && (
        <div className={styles.saveDialog}>
          <div className={styles.saveDialogContent}>
            <h4>레이아웃 저장 후 완료</h4>
            <div className={styles.inputGroup}>
              <label htmlFor="layoutName">레이아웃 이름</label>
              <input
                id="layoutName"
                type="text"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder="레이아웃 이름을 입력하세요"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    saveAndComplete();
                  } else if (e.key === 'Escape') {
                    cancelSave();
                  }
                }}
              />
            </div>
            <div className={styles.dialogActions}>
              <button className={styles.cancelButton} onClick={cancelSave}>
                취소
              </button>
              <button
                className={styles.confirmButton}
                onClick={saveAndComplete}
                disabled={!layoutName.trim()}
              >
                저장 후 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingToolbar;