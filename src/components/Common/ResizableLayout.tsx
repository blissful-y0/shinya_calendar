import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { sidebarWidthState, sidebarPositionState } from '@store/atoms';
import styles from './ResizableLayout.module.scss';

interface ResizableLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
}

const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  children,
  sidebar,
  minWidth = 280,
  maxWidth = 600
}) => {
  const [sidebarWidth, setSidebarWidth] = useRecoilState(sidebarWidthState);
  const sidebarPosition = useRecoilValue(sidebarPositionState);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    // 사이드바 위치에 따라 너비 계산
    const newWidth = sidebarPosition === 'right'
      ? containerRect.right - e.clientX
      : e.clientX - containerRect.left;

    // 최소/최대 너비 제한
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setSidebarWidth(constrainedWidth);
  }, [isResizing, minWidth, maxWidth, setSidebarWidth, sidebarPosition]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    // 더블클릭 시 기본 너비로 리셋
    setSidebarWidth(320);
  }, [setSidebarWidth]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // 리사이징 중 텍스트 선택 방지
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className={styles.resizableLayout} ref={containerRef}>
      <div
        className={`${styles.mainContent} ${isResizing ? styles.resizing : ''}`}
        style={{
          marginRight: sidebarPosition === 'right' ? `${sidebarWidth}px` : 0,
          marginLeft: sidebarPosition === 'left' ? `${sidebarWidth}px` : 0
        }}
      >
        {children}
      </div>

      <div
        className={`${styles.sidebar} ${sidebarPosition === 'left' ? styles.left : styles.right}`}
        style={{ width: `${sidebarWidth}px` }}
      >
        <div
          className={`${styles.resizeHandle} ${isResizing ? styles.active : ''}`}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          title="드래그하여 크기 조절 (더블클릭: 기본 크기)"
        >
          <div className={styles.handleBar} />
        </div>
        {sidebar}
      </div>
    </div>
  );
};

export default ResizableLayout;