import React, { useState } from 'react';
import { useRecoilState } from 'recoil';
import { dDaysState, activeDDayState } from '@store/atoms';
import { DDay } from '@types/index';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import styles from './DDayModal.module.scss';

interface DDayModalProps {
  onClose: () => void;
}

const DDayModal: React.FC<DDayModalProps> = ({ onClose }) => {
  const [ddays, setDDays] = useRecoilState(dDaysState);
  const [activeDDay, setActiveDDay] = useRecoilState(activeDDayState);
  const [showForm, setShowForm] = useState(false);
  const [editingDDay, setEditingDDay] = useState<DDay | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !targetDate) return;

    const newDDay: DDay = {
      id: editingDDay?.id || uuidv4(),
      title: title.trim(),
      description: description.trim(),
      targetDate: new Date(targetDate),
      isActive: false,
      createdAt: editingDDay?.createdAt || new Date()
    };

    if (editingDDay) {
      setDDays(prev => prev.map(d => d.id === editingDDay.id ? newDDay : d));
      if (activeDDay?.id === editingDDay.id) {
        setActiveDDay(newDDay);
      }
    } else {
      setDDays(prev => [...prev, newDDay]);
      // 첫 번째 D-Day인 경우 자동 활성화
      if (ddays.length === 0) {
        setActiveDDay(newDDay);
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetDate('');
    setShowForm(false);
    setEditingDDay(null);
  };

  const handleEdit = (dday: DDay) => {
    setEditingDDay(dday);
    setTitle(dday.title);
    setDescription(dday.description || '');
    setTargetDate(format(dday.targetDate, 'yyyy-MM-dd'));
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setDDays(prev => prev.filter(d => d.id !== id));
      if (activeDDay?.id === id) {
        setActiveDDay(null);
      }
    }
  };

  const handleSetActive = (dday: DDay) => {
    setActiveDDay(dday);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>D-Day 관리</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {!showForm ? (
            <button
              className={styles.addNewButton}
              onClick={() => setShowForm(true)}
            >
              + 새로운 D-Day 추가
            </button>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="modal-dday-title">제목</label>
                <input
                  id="modal-dday-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="D-Day 제목을 입력하세요"
                  required
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="modal-dday-date">날짜</label>
                <input
                  id="modal-dday-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="modal-dday-desc">설명 (선택)</label>
                <textarea
                  id="modal-dday-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="어떤 날인지 설명해주세요"
                  rows={3}
                />
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={resetForm} className={styles.cancelButton}>
                  취소
                </button>
                <button type="submit" className={styles.saveButton}>
                  {editingDDay ? '수정' : '저장'}
                </button>
              </div>
            </form>
          )}

          <div className={styles.ddayList}>
            {ddays.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📅</span>
                <p>등록된 D-Day가 없습니다</p>
                <span>중요한 날을 추가해보세요</span>
              </div>
            ) : (
              ddays.map(dday => {
                const isActive = activeDDay?.id === dday.id;
                return (
                  <div
                    key={dday.id}
                    className={`${styles.ddayItem} ${isActive ? styles.active : ''}`}
                  >
                    <div className={styles.ddayInfo}>
                      <div className={styles.ddayHeader}>
                        <span className={styles.ddayItemTitle}>{dday.title}</span>
                        {isActive && (
                          <span className={styles.activeBadge}>활성</span>
                        )}
                      </div>
                      <div className={styles.ddayItemDate}>
                        {format(new Date(dday.targetDate), 'yyyy년 MM월 dd일')}
                      </div>
                      {dday.description && (
                        <div className={styles.ddayItemDesc}>{dday.description}</div>
                      )}
                    </div>
                    <div className={styles.ddayActions}>
                      {!isActive && (
                        <button
                          className={styles.activateButton}
                          onClick={() => handleSetActive(dday)}
                          title="활성화"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(dday)}
                        title="수정"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(dday.id)}
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DDayModal;