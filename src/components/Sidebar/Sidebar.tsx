import React, { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  selectedDateState,
  eventsState,
  diaryEntriesState,
  sidebarOpenState
} from '@store/atoms';
import EventForm from './EventForm';
import EventList from './EventList';
import DiarySection from './DiarySection';
import DDayWidget from '../Common/DDayWidget';
import { formatDate } from '@utils/calendar';
import { getEventsForDate } from '@utils/eventUtils';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
import styles from './Sidebar.module.scss';

const Sidebar: React.FC = () => {
  const [sidebarOpen] = useRecoilState(sidebarOpenState);
  const selectedDate = useRecoilValue(selectedDateState);
  const events = useRecoilValue(eventsState);
  const diaryEntries = useRecoilValue(diaryEntriesState);
  const [activeTab, setActiveTab] = useState<'events' | 'diary'>('events');
  const [showEventForm, setShowEventForm] = useState(false);

  // 반복 이벤트를 포함하여 선택된 날짜의 이벤트 가져오기
  // 선택된 날짜 기준 3개월 범위로 반복 이벤트 계산
  const rangeStart = startOfMonth(addMonths(selectedDate, -1));
  const rangeEnd = endOfMonth(addMonths(selectedDate, 2));
  const selectedDateEvents = getEventsForDate(events, selectedDate, rangeStart, rangeEnd);

  const selectedDateDiary = diaryEntries.find(entry =>
    formatDate(new Date(entry.date)) === formatDate(selectedDate)
  );

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
      <DDayWidget />
      <div className={styles.divider}></div>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.dateTitle}>
          {formatDate(selectedDate, 'yyyy년 M월 d일 EEEE')}
        </h3>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'events' ? styles.active : ''}`}
            onClick={() => setActiveTab('events')}
          >
            이벤트
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'diary' ? styles.active : ''}`}
            onClick={() => setActiveTab('diary')}
          >
            일기
          </button>
        </div>
      </div>

      <div className={styles.sidebarContent}>
        {activeTab === 'events' && (
          <>
            <div className={styles.actionBar}>
              <button
                className={styles.addButton}
                onClick={() => setShowEventForm(!showEventForm)}
              >
                {showEventForm ? '취소' : '+ 이벤트 추가'}
              </button>
            </div>
            {showEventForm && (
              <EventForm
                date={selectedDate}
                onClose={() => setShowEventForm(false)}
              />
            )}
            <EventList events={selectedDateEvents} />
          </>
        )}

        {activeTab === 'diary' && (
          <DiarySection
            date={selectedDate}
            entry={selectedDateDiary}
          />
        )}
      </div>
    </aside>
  );
};

export default Sidebar;