import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { stickersState, stickerEditModeState, modalActiveState, stickerLayoutsState, stickerVisibilityState } from '@store/atoms';
import { MdDelete } from 'react-icons/md';
import { Sticker } from './StickerPanel';
import styles from './StickerCanvas.module.scss';

interface DraggingState {
  id: string;
  offsetX: number;
  offsetY: number;
}

interface ResizingState {
  id: string;
  startWidth: number;
  startHeight: number;
  startX: number;
  startY: number;
}

interface RotatingState {
  id: string;
  startAngle: number;
  centerX: number;
  centerY: number;
}

const StickerCanvas: React.FC = () => {
  const [stickers, setStickers] = useRecoilState(stickersState);
  const stickerEditMode = useRecoilValue(stickerEditModeState);
  const isModalActive = useRecoilValue(modalActiveState);
  const stickerVisibility = useRecoilValue(stickerVisibilityState);
  const stickerLayouts = useRecoilValue(stickerLayoutsState);
  const [dragging, setDragging] = useState<DraggingState | null>(null);
  const [resizing, setResizing] = useState<ResizingState | null>(null);
  const [rotating, setRotating] = useState<RotatingState | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, sticker: Sticker) => {
    if (!stickerEditMode) return;

    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left - sticker.x;
    const offsetY = e.clientY - rect.top - sticker.y;

    setDragging({ id: sticker.id, offsetX, offsetY });
    setSelectedSticker(sticker.id);

    // 선택된 스티커를 맨 앞으로 가져오기
    setStickers(prev =>
      prev.map(s =>
        s.id === sticker.id
          ? { ...s, zIndex: Date.now() }
          : s
      )
    );
  };

  const handleResizeStart = (e: React.MouseEvent, sticker: Sticker) => {
    e.preventDefault();
    e.stopPropagation();

    setResizing({
      id: sticker.id,
      startWidth: sticker.width,
      startHeight: sticker.height,
      startX: e.clientX,
      startY: e.clientY
    });
    setSelectedSticker(sticker.id);
  };

  const handleRotateStart = (e: React.MouseEvent, sticker: Sticker) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = sticker.x + sticker.width / 2;
    const centerY = sticker.y + sticker.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const startAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * 180 / Math.PI - sticker.rotation;

    setRotating({
      id: sticker.id,
      startAngle,
      centerX,
      centerY
    });
    setSelectedSticker(sticker.id);
  };

  // 전역 마우스 이동 핸들러 (부드러운 드래그를 위해)
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging && !resizing && !rotating) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (dragging) {
      // 부드러운 이동을 위해 제한을 완화하고 더 자유로운 움직임 허용
      const newX = e.clientX - rect.left - dragging.offsetX;
      const newY = e.clientY - rect.top - dragging.offsetY;

      // 캔버스 경계를 벗어나지 않도록 하되, 여유를 둠
      const boundedX = Math.max(-50, Math.min(newX, rect.width - 50));
      const boundedY = Math.max(-50, Math.min(newY, rect.height - 50));

      setStickers(prev =>
        prev.map(s =>
          s.id === dragging.id
            ? { ...s, x: boundedX, y: boundedY }
            : s
        )
      );
    }

    if (resizing) {
      const deltaX = e.clientX - resizing.startX;
      const deltaY = e.clientY - resizing.startY;
      const delta = Math.max(deltaX, deltaY); // 비율 유지를 위해 더 큰 값 사용
      const newWidth = Math.max(30, Math.min(resizing.startWidth + delta, 300));
      const newHeight = Math.max(30, Math.min(resizing.startHeight + delta, 300));

      setStickers(prev =>
        prev.map(s =>
          s.id === resizing.id
            ? { ...s, width: newWidth, height: newHeight }
            : s
        )
      );
    }

    if (rotating) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const currentAngle = Math.atan2(mouseY - rotating.centerY, mouseX - rotating.centerX) * 180 / Math.PI;
      const newRotation = currentAngle - rotating.startAngle;

      setStickers(prev =>
        prev.map(s =>
          s.id === rotating.id
            ? { ...s, rotation: newRotation }
            : s
        )
      );
    }
  }, [dragging, resizing, rotating, setStickers]);

  const handleGlobalMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
    setRotating(null);
  }, []);

  // 전역 이벤트 리스너 등록
  useEffect(() => {
    if (dragging || resizing || rotating) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [dragging, resizing, rotating, handleGlobalMouseMove, handleGlobalMouseUp]);

  // 캔버스 클릭으로 선택 해제
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedSticker(null);
    }
  };

  // 편집 모드가 비활성화되면 선택 상태 해제
  useEffect(() => {
    if (!stickerEditMode) {
      setSelectedSticker(null);
      setDragging(null);
      setResizing(null);
      setRotating(null);
    }
  }, [stickerEditMode]);

  // 해상도 변경 감지 및 자동 레이아웃 로딩
  useEffect(() => {
    const handleResize = () => {
      const currentResolution = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // 현재 해상도에 맞는 레이아웃 찾기
      const matchingLayout = stickerLayouts.find(
        layout => layout.resolution.width === currentResolution.width &&
                 layout.resolution.height === currentResolution.height
      );

      if (matchingLayout) {
        setStickers(matchingLayout.stickers);
      }
    };

    // 초기 로딩
    handleResize();

    // 윈도우 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [stickerLayouts, setStickers]);


  const handleStickerRightClick = (e: React.MouseEvent, stickerId: string) => {
    if (!stickerEditMode) return;

    e.preventDefault();
    if (confirm('이 스티커를 삭제하시겠습니까?')) {
      setStickers(prev => prev.filter(s => s.id !== stickerId));
      setSelectedSticker(null);
    }
  };

  const handleDeleteSticker = (e: React.MouseEvent, stickerId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm('이 스티커를 삭제하시겠습니까?')) {
      setStickers(prev => prev.filter(s => s.id !== stickerId));
      setSelectedSticker(null);
    }
  };

  // 모달이 활성화되거나 스티커 표시가 꺼져있으면 스티커 캔버스 숨기기
  if (isModalActive || !stickerVisibility) {
    return null;
  }

  return (
    <div
      ref={canvasRef}
      className={styles.stickerCanvas}
      onClick={handleCanvasClick}
    >
      {stickers.map(sticker => {
        const isSelected = selectedSticker === sticker.id;
        const isDragging = dragging?.id === sticker.id;
        const isResizing = resizing?.id === sticker.id;
        const isRotating = rotating?.id === sticker.id;

        return (
          <div
            key={sticker.id}
            className={`${styles.sticker} ${isDragging ? styles.dragging : ''} ${isSelected && stickerEditMode ? styles.selected : ''} ${!stickerEditMode ? styles.readOnly : ''}`}
            style={{
              left: sticker.x,
              top: sticker.y,
              width: sticker.width,
              height: sticker.height,
              zIndex: sticker.zIndex,
              backgroundImage: `url(${sticker.image})`,
              transform: `rotate(${sticker.rotation}deg)`
            }}
            onMouseDown={(e) => handleMouseDown(e, sticker)}
            onContextMenu={(e) => handleStickerRightClick(e, sticker.id)}
            title={stickerEditMode ? "편집 모드: 클릭-선택 | 드래그-이동 | 핸들-크기/회전 조정 | X버튼-삭제 | 우클릭-삭제" : "읽기 전용 모드: 편집하려면 편집 모드를 활성화하세요"}
          >
            {isSelected && stickerEditMode && (
              <>
                {/* 삭제 버튼 */}
                <button
                  className={`${styles.handle} ${styles.deleteHandle}`}
                  onMouseDown={(e) => handleDeleteSticker(e, sticker.id)}
                  title="스티커 삭제"
                >
                  <MdDelete />
                </button>

                {/* 리사이즈 핸들 */}
                <div
                  className={`${styles.handle} ${styles.resizeHandle}`}
                  onMouseDown={(e) => handleResizeStart(e, sticker)}
                  title="크기 조정"
                />
                {/* 회전 핸들 */}
                <div
                  className={`${styles.handle} ${styles.rotateHandle}`}
                  onMouseDown={(e) => handleRotateStart(e, sticker)}
                  title="회전"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StickerCanvas;