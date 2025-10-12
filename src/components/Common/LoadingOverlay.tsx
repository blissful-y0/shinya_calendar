import React from "react";
import { useRecoilValue } from "recoil";
import { globalLoadingState } from "@store/atoms";
import styles from "./LoadingOverlay.module.scss";

const LoadingOverlay: React.FC = () => {
  const isLoading = useRecoilValue(globalLoadingState);

  if (!isLoading) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>처리 중...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
