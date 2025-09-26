import React, { useState } from 'react';
import { MdBrush } from 'react-icons/md';
import StylingManager from './StylingManager';
import styles from './FloatingActionButton.module.scss';

const FloatingActionButton: React.FC = () => {
  const [showStylingManager, setShowStylingManager] = useState(false);

  return (
    <>
      <button
        className={styles.fab}
        onClick={() => setShowStylingManager(true)}
        title="스타일링 매니저"
      >
        <MdBrush />
      </button>

      {showStylingManager && (
        <StylingManager onClose={() => setShowStylingManager(false)} />
      )}
    </>
  );
};

export default FloatingActionButton;