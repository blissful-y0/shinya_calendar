import React, { useState } from 'react';
import { useSetRecoilState } from 'recoil';
import { eventsState } from '@store/atoms';
import { Event } from '@types/index';
import { v4 as uuidv4 } from 'uuid';
import styles from './EventForm.module.scss';

interface EventFormProps {
  date: Date;
  onClose: () => void;
  event?: Event;
}

const EventForm: React.FC<EventFormProps> = ({ date, onClose, event }) => {
  const setEvents = useSetRecoilState(eventsState);
  const [title, setTitle] = useState(event?.title || '');
  const [startTime, setStartTime] = useState(event?.startTime || '');
  const [endTime, setEndTime] = useState(event?.endTime || '');
  const [description, setDescription] = useState(event?.description || '');
  const [color, setColor] = useState(event?.color || '#FFB6C1');

  const colorOptions = [
    '#FFB6C1', '#FFC0CB', '#FFE4B5', '#E6E6FA',
    '#B0E0E6', '#98FB98', '#F0E68C', '#DDA0DD'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    const newEvent: Event = {
      id: event?.id || uuidv4(),
      title: title.trim(),
      date,
      startTime,
      endTime,
      description,
      color,
      tags: []
    };

    setEvents(prev => {
      if (event) {
        return prev.map(e => e.id === event.id ? newEvent : e);
      }
      return [...prev, newEvent];
    });

    onClose();
  };

  return (
    <form className={styles.eventForm} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="title">이벤트 제목</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="이벤트 제목을 입력하세요"
          required
        />
      </div>

      <div className={styles.timeGroup}>
        <div className={styles.formGroup}>
          <label htmlFor="startTime">시작 시간</label>
          <input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="endTime">종료 시간</label>
          <input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">설명</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명 추가 (선택사항)"
          rows={3}
        />
      </div>

      <div className={styles.formGroup}>
        <label>색상</label>
        <div className={styles.colorOptions}>
          {colorOptions.map(colorOption => (
            <button
              key={colorOption}
              type="button"
              className={`${styles.colorOption} ${color === colorOption ? styles.selected : ''}`}
              style={{ backgroundColor: colorOption }}
              onClick={() => setColor(colorOption)}
            />
          ))}
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelButton} onClick={onClose}>
          취소
        </button>
        <button type="submit" className={styles.saveButton}>
          {event ? '수정' : '저장'}
        </button>
      </div>
    </form>
  );
};

export default EventForm;