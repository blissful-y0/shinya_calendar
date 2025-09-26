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

  // 퍼센트를 픽셀로 변환
  const percentToPixel = (percent: number, dimension: number) => {
    return (percent / 100) * dimension;
  };

  // 픽셀을 퍼센트로 변환
  const pixelToPercent = (pixel: number, dimension: number) => {
    return (pixel / dimension) * 100;
  };

  // 스티커의 실제 픽셀 위치 계산
  const getStickerPixelPosition = (sticker: Sticker) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0, width: 100, height: 100 };

    return {
      x: percentToPixel(sticker.x, rect.width),
      y: percentToPixel(sticker.y, rect.height),
      width: percentToPixel(sticker.width, rect.width),
      height: percentToPixel(sticker.height, rect.width) // 비율 유지를 위해 width 기준
    };
  };

  const handleMouseDown = (e: React.MouseEvent, sticker: Sticker) => {
    if (!stickerEditMode) return;

    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pixelPos = getStickerPixelPosition(sticker);
    const offsetX = e.clientX - rect.left - pixelPos.x;
    const offsetY = e.clientY - rect.top - pixelPos.y;

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

    const pixelPos = getStickerPixelPosition(sticker);
    setResizing({
      id: sticker.id,
      startWidth: pixelPos.width,
      startHeight: pixelPos.height,
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

    const pixelPos = getStickerPixelPosition(sticker);
    const centerX = pixelPos.x + pixelPos.width / 2;
    const centerY = pixelPos.y + pixelPos.height / 2;
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
      const boundedX = Math.max(0, Math.min(newX, rect.width - 50));
      const boundedY = Math.max(0, Math.min(newY, rect.height - 50));

      // 픽셀을 퍼센트로 변환하여 저장
      const percentX = pixelToPercent(boundedX, rect.width);
      const percentY = pixelToPercent(boundedY, rect.height);

      setStickers(prev =>
        prev.map(s =>
          s.id === dragging.id
            ? { ...s, x: percentX, y: percentY }
            : s
        )
      );
    }

    if (resizing) {
      const deltaX = e.clientX - resizing.startX;
      const deltaY = e.clientY - resizing.startY;
      const delta = Math.max(deltaX, deltaY); // 비율 유지를 위해 더 큰 값 사용
      const newWidthPx = Math.max(30, Math.min(resizing.startWidth + delta, 300));
      const newHeightPx = Math.max(30, Math.min(resizing.startHeight + delta, 300));

      // 픽셀을 퍼센트로 변환
      const percentWidth = pixelToPercent(newWidthPx, rect.width);
      const percentHeight = pixelToPercent(newHeightPx, rect.width); // 비율 유지를 위해 width 기준

      setStickers(prev =>
        prev.map(s =>
          s.id === resizing.id
            ? { ...s, width: percentWidth, height: percentHeight }
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

  // 윈도우 리사이즈 시 스티커들이 자동으로 비율에 맞게 조정됨
  // 퍼센트 기반 위치를 사용하므로 별도의 리사이즈 처리가 필요하지 않음
  useEffect(() => {
    const handleResize = () => {
      // 강제로 리렌더링을 트리거하여 스티커 위치 재계산
      // 퍼센트 값은 그대로 유지되고 픽셀 계산만 새로 수행됨
      setStickers(prev => [...prev]);
    };

    // 윈도우 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setStickers]);


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
        const pixelPos = getStickerPixelPosition(sticker);

        return (
          <div
            key={sticker.id}
            className={`${styles.sticker} ${isDragging ? styles.dragging : ''} ${isSelected && stickerEditMode ? styles.selected : ''} ${!stickerEditMode ? styles.readOnly : ''}`}
            style={{
              left: pixelPos.x,
              top: pixelPos.y,
              width: pixelPos.width,
              height: pixelPos.height,
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