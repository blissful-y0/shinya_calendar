import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { activeDDayState } from '@store/atoms';
import { differenceInDays } from 'date-fns';
import { MdCalendarToday, MdSettings } from 'react-icons/md';
import DDayModal from './DDayModal';
import styles from './DDayWidget.module.scss';

const DDayWidget: React.FC = () => {
  const activeDDay = useRecoilValue(activeDDayState);
  const [daysDiff, setDaysDiff] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (activeDDay) {
      const updateDaysDiff = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(activeDDay.targetDate);
        targetDate.setHours(0, 0, 0, 0);
        const diff = differenceInDays(targetDate, today);
        setDaysDiff(diff);
      };

      updateDaysDiff();
      const interval = setInterval(updateDaysDiff, 1000 * 60 * 60); // 1시간마다 체크
      return () => clearInterval(interval);
    }
  }, [activeDDay]);

  const formatDDay = (days: number) => {
    if (days === 0) return 'D-DAY';
    if (days > 0) return `D-${days}`;
    return `D+${Math.abs(days)}`;
  };

  const getDDayStyle = (days: number) => {
    if (days === 0) return styles.dday;
    if (days > 0 && days <= 7) return styles.soon;
    if (days > 0) return styles.future;
    return styles.past;
  };

  return (
    <>
      <div className={styles.ddayWidget}>
        {activeDDay ? (
          <div
            className={`${styles.ddayContent} ${getDDayStyle(daysDiff)}`}
            onClick={() => setShowModal(true)}
          >
            <div className={styles.ddayInfo}>
              <span className={styles.ddayBadge}>{formatDDay(daysDiff)}</span>
              <div className={styles.ddayText}>
                <div className={styles.ddayTitle}>{activeDDay.title}</div>
                {activeDDay.description && (
                  <div className={styles.ddayDescription}>
                    {activeDDay.description}
                  </div>
                )}
              </div>
            </div>
            <button className={styles.settingsButton} title="D-Day 관리">
              <MdSettings />
            </button>
          </div>
        ) : (
          <div className={styles.emptyDDay} onClick={() => setShowModal(true)}>
            <span className={styles.addIcon}><MdCalendarToday /></span>
            <span className={styles.addText}>D-Day 설정하기</span>
          </div>
        )}
      </div>

      {showModal && (
        <DDayModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default DDayWidget;