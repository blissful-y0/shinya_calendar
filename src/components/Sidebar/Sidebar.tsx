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
import ThemeSelector from '../Theme/ThemeSelector';
import DDayWidget from '../Common/DDayWidget';
import { formatDate } from '@utils/calendar';
import styles from './Sidebar.module.scss';

const Sidebar: React.FC = () => {
  const [sidebarOpen] = useRecoilState(sidebarOpenState);
  const selectedDate = useRecoilValue(selectedDateState);
  const events = useRecoilValue(eventsState);
  const diaryEntries = useRecoilValue(diaryEntriesState);
  const [activeTab, setActiveTab] = useState<'events' | 'diary' | 'theme'>('events');
  const [showEventForm, setShowEventForm] = useState(false);

  const selectedDateEvents = events.filter(event =>
    formatDate(new Date(event.date)) === formatDate(selectedDate)
  );

  const selectedDateDiary = diaryEntries.find(entry =>
    formatDate(new Date(entry.date)) === formatDate(selectedDate)
  );

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
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
          <button
            className={`${styles.tab} ${activeTab === 'theme' ? styles.active : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            테마
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

        {activeTab === 'theme' && (
          <ThemeSelector />
        )}
      </div>
      <DDayWidget />
    </aside>
  );
};

export default Sidebar;