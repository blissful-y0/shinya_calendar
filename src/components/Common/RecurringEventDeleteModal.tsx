import React from "react";
import styles from "./RecurringEventDeleteModal.module.scss";

interface RecurringEventDeleteModalProps {
  isOpen: boolean;
  eventTitle: string;
  eventDate: Date;
  onDeleteSingle: () => void;
  onDeleteAll: () => void;
  onCancel: () => void;
}

const RecurringEventDeleteModal: React.FC<RecurringEventDeleteModalProps> = ({
  isOpen,
  eventTitle,
  eventDate,
  onDeleteSingle,
  onDeleteAll,
  onCancel,
}) => {
  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(date);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>반복 이벤트 삭제</h3>
        </div>

        <div className={styles.content}>
          <p className={styles.eventInfo}>
            <strong>"{eventTitle}"</strong>
            <br />
            <span className={styles.date}>{formatDate(eventDate)}</span>
          </p>

          <p className={styles.question}>
            이 반복 이벤트를 어떻게 삭제하시겠습니까?
          </p>

          <div className={styles.options}>
            <button
              className={styles.optionButton}
              onClick={onDeleteSingle}
            >
              <div className={styles.optionTitle}>이 이벤트만 삭제</div>
              <div className={styles.optionDescription}>
                선택한 날짜의 이벤트만 삭제하고, 다른 반복 일정은 유지합니다.
              </div>
            </button>

            <button
              className={styles.optionButton}
              onClick={onDeleteAll}
            >
              <div className={styles.optionTitle}>모든 반복 이벤트 삭제</div>
              <div className={styles.optionDescription}>
                이 시리즈의 모든 반복 이벤트를 삭제합니다.
              </div>
            </button>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onCancel}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurringEventDeleteModal;