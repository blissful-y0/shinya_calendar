import React, { useState, useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { diaryEntriesState } from "@store/atoms";
import { DiaryEntry } from "@types/index";
import { v4 as uuidv4 } from "uuid";
import styles from "./DiarySection.module.scss";

interface DiarySectionProps {
  date: Date;
  entry?: DiaryEntry;
}

const DiarySection: React.FC<DiarySectionProps> = ({ date, entry }) => {
  const setDiaryEntries = useSetRecoilState(diaryEntriesState);
  const [content, setContent] = useState(entry?.content || "");
  const [title, setTitle] = useState(entry?.title || "");
  const [mood, setMood] = useState<DiaryEntry["mood"]>(
    entry?.mood || "neutral"
  );
  const [weather, setWeather] = useState(entry?.weather || "");
  const [isEditing, setIsEditing] = useState(!entry);

  useEffect(() => {
    setContent(entry?.content || "");
    setTitle(entry?.title || "");
    setMood(entry?.mood || "neutral");
    setWeather(entry?.weather || "");
    setIsEditing(!entry);
  }, [entry, date]);

  const moodEmojis = {
    happy: "😊",
    sad: "😢",
    neutral: "😐",
    excited: "🎉",
    tired: "😴",
  };

  const weatherOptions = [
    "☀️ Sunny",
    "☁️ Cloudy",
    "🌧️ Rainy",
    "❄️ Snowy",
    "🌈 Rainbow",
  ];

  const handleSave = () => {
    if (!content.trim()) return;

    const newEntry: DiaryEntry = {
      id: entry?.id || uuidv4(),
      date,
      title,
      content,
      mood,
      weather,
      tags: [],
    };

    setDiaryEntries((prev) => {
      if (entry) {
        return prev.map((e) => (e.id === entry.id ? newEntry : e));
      }
      return [...prev, newEntry];
    });

    setIsEditing(false);
  };

  const handleDelete = () => {
    if (entry) {
      setDiaryEntries((prev) => prev.filter((e) => e.id !== entry.id));
      setContent("");
      setTitle("");
      setMood("neutral");
      setWeather("");
      setIsEditing(true);
    }
  };

  if (!isEditing && entry) {
    return (
      <div className={styles.diaryView}>
        <div className={styles.diaryHeader}>
          {entry.title && <h3 className={styles.diaryTitle}>{entry.title}</h3>}
          <div className={styles.diaryMeta}>
            <span className={styles.mood}>
              {moodEmojis[entry.mood || "neutral"]}
            </span>
            {entry.weather && (
              <span className={styles.weather}>{entry.weather}</span>
            )}
          </div>
        </div>
        <div className={styles.diaryContent}>{entry.content}</div>
        <div className={styles.diaryActions}>
          <button
            className={styles.editButton}
            onClick={() => setIsEditing(true)}
          >
            수정
          </button>
          <button className={styles.deleteButton} onClick={handleDelete}>
            삭제
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.diaryForm}>
      <div className={styles.formGroup}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="일기 제목 (선택사항)"
          className={styles.titleInput}
        />
      </div>

      <div className={styles.moodSelector}>
        <label>기분 기록</label>
        <div className={styles.moodOptions}>
          {Object.entries(moodEmojis).map(([moodKey, emoji]) => (
            <button
              key={moodKey}
              type="button"
              className={`${styles.moodOption} ${
                mood === moodKey ? styles.selected : ""
              }`}
              onClick={() => setMood(moodKey as DiaryEntry["mood"])}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>날씨</label>
        <select
          value={weather}
          onChange={(e) => setWeather(e.target.value)}
          className={styles.weatherSelect}
        >
          <option value="">날씨 선택</option>
          {weatherOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘 하루는 어땠나요?"
          className={styles.contentInput}
          rows={10}
        />
      </div>

      <div className={styles.formActions}>
        {entry && (
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => setIsEditing(false)}
          >
            취소
          </button>
        )}
        <button
          type="button"
          className={styles.saveButton}
          onClick={handleSave}
          disabled={!content.trim()}
        >
          저장
        </button>
      </div>
    </div>
  );
};

export default DiarySection;
