import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { activeDDayState } from '@store/atoms';
import { differenceInDays } from 'date-fns';
import styles from './DDayDisplay.module.scss';

const DDayDisplay: React.FC = () => {
  const activeDDay = useRecoilValue(activeDDayState);
  const [daysDiff, setDaysDiff] = useState<number>(0);

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
      // 매일 자정에 업데이트
      const interval = setInterval(updateDaysDiff, 1000 * 60 * 60); // 1시간마다 체크

      return () => clearInterval(interval);
    }
  }, [activeDDay]);

  if (!activeDDay) {
    return null;
  }

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
    <div className={`${styles.ddayDisplay} ${getDDayStyle(daysDiff)}`}>
      <div className={styles.ddayHeader}>
        <span className={styles.ddayBadge}>{formatDDay(daysDiff)}</span>
        <span className={styles.ddayTitle}>{activeDDay.title}</span>
      </div>
      {activeDDay.description && (
        <div className={styles.ddayDescription}>
          {activeDDay.description}
        </div>
      )}
      <div className={styles.ddayDate}>
        {new Date(activeDDay.targetDate).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        })}
      </div>
    </div>
  );
};

export default DDayDisplay;