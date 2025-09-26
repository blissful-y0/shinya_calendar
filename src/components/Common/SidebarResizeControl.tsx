import React from 'react';
import { useRecoilState } from 'recoil';
import { sidebarWidthState } from '@store/atoms';
import styles from './SidebarResizeControl.module.scss';

const SidebarResizeControl: React.FC = () => {
  const [sidebarWidth, setSidebarWidth] = useRecoilState(sidebarWidthState);

  const presetSizes = [
    { label: '소형', value: 280 },
    { label: '중형', value: 320 },
    { label: '대형', value: 450 },
    { label: '최대', value: 600 }
  ];

  return (
    <div className={styles.resizeControl}>
      <div className={styles.currentSize}>
        <span className={styles.label}>사이드바 너비:</span>
        <span className={styles.value}>{sidebarWidth}px</span>
      </div>
      <div className={styles.presetButtons}>
        {presetSizes.map((size) => (
          <button
            key={size.value}
            className={`${styles.presetButton} ${
              sidebarWidth === size.value ? styles.active : ''
            }`}
            onClick={() => setSidebarWidth(size.value)}
            title={`${size.value}px`}
          >
            {size.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SidebarResizeControl;