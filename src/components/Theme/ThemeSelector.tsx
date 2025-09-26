import React, { useState, useEffect } from "react";
import { useTheme } from "@hooks/useTheme";
import { Theme } from "@types";
import { v4 as uuidv4 } from "uuid";
import styles from "./ThemeSelector.module.scss";

const ThemeSelector: React.FC = () => {
  const {
    currentTheme,
    allThemes,
    selectTheme,
    createCustomTheme,
    deleteCustomTheme,
    previewTheme,
    resetPreview,
  } = useTheme();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customThemeName, setCustomThemeName] = useState("");
  const [customColors, setCustomColors] = useState({
    primary: "#FFB6C1",
    secondary: "#FFC0CB",
    accent: "#FFE4E1",
    background: "#FFF8F5",
    surface: "#FFFFFF",
    text: "#4A4A4A",
    textSecondary: "#8B8B8B",
    border: "#F5E6E0",
    danger: "#FF6B6B",
    dangerLight: "#FFE5E5",
  });
  const [isPreviewing, setIsPreviewing] = useState(false);

  // 컴포넌트가 언마운트되거나 폼이 닫힐 때 미리보기 리셋
  useEffect(() => {
    if (!showCustomForm && isPreviewing) {
      resetPreview();
      setIsPreviewing(false);
    }
  }, [showCustomForm, isPreviewing, resetPreview]);

  // 색상이 변경될 때마다 실시간 미리보기
  useEffect(() => {
    if (showCustomForm && isPreviewing) {
      previewTheme(customColors);
    }
  }, [customColors, showCustomForm, isPreviewing, previewTheme]);

  const handleCreateCustomTheme = () => {
    if (!customThemeName.trim()) return;

    const newTheme: Theme = {
      id: uuidv4(),
      name: customThemeName,
      colors: customColors,
    };

    createCustomTheme(newTheme);
    setShowCustomForm(false);
    setCustomThemeName("");
    setIsPreviewing(false);
    selectTheme(newTheme.id);
  };

  const handleCancelCustomForm = () => {
    setShowCustomForm(false);
    setCustomThemeName("");
    setIsPreviewing(false);
    resetPreview();
  };

  const togglePreview = () => {
    if (isPreviewing) {
      resetPreview();
      setIsPreviewing(false);
    } else {
      previewTheme(customColors);
      setIsPreviewing(true);
    }
  };

  const renderThemePreview = (theme: Theme) => {
    return (
      <div
        className={`${styles.themeCard} ${
          currentTheme.id === theme.id ? styles.selected : ""
        }`}
        onClick={() => selectTheme(theme.id)}
      >
        <div className={styles.colorPreview}>
          <div
            className={styles.colorBar}
            style={{ backgroundColor: theme.colors.primary }}
          />
          <div
            className={styles.colorBar}
            style={{ backgroundColor: theme.colors.secondary }}
          />
          <div
            className={styles.colorBar}
            style={{ backgroundColor: theme.colors.accent }}
          />
          <div
            className={styles.colorBar}
            style={{ backgroundColor: theme.colors.background }}
          />
        </div>
        <div className={styles.themeName}>{theme.name}</div>
        {!theme.id.includes("pastel") && (
          <button
            className={styles.deleteTheme}
            onClick={(e) => {
              e.stopPropagation();
              deleteCustomTheme(theme.id);
            }}
          >
            ×
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={styles.themeSelector}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>테마 프리셋</h4>
        <div className={styles.themeGrid}>
          {allThemes
            .filter((t) => t.id.includes("pastel"))
            .map((theme) => renderThemePreview(theme))}
        </div>
      </div>

      {allThemes.filter((t) => !t.id.includes("pastel")).length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>커스텀 테마</h4>
          <div className={styles.themeGrid}>
            {allThemes
              .filter((t) => !t.id.includes("pastel"))
              .map((theme) => renderThemePreview(theme))}
          </div>
        </div>
      )}

      {!showCustomForm ? (
        <button
          className={styles.createButton}
          onClick={() => setShowCustomForm(true)}
        >
          + 커스텀 테마 만들기
        </button>
      ) : (
        <div className={styles.customForm}>
          <h4 className={styles.formTitle}>커스텀 테마 만들기</h4>

          <div className={styles.formGroup}>
            <label>테마 이름</label>
            <input
              type="text"
              value={customThemeName}
              onChange={(e) => setCustomThemeName(e.target.value)}
              placeholder="테마 이름을 입력하세요"
            />
          </div>

          <div className={styles.previewToggle}>
            <label className={styles.previewLabel}>
              <input
                type="checkbox"
                checked={isPreviewing}
                onChange={togglePreview}
              />
              실시간 미리보기
            </label>
            <span className={styles.previewHint}>
              {isPreviewing
                ? "변경사항이 실시간으로 적용됩니다"
                : "체크하면 색상 변경을 미리 볼 수 있습니다"}
            </span>
          </div>

          <div className={styles.colorInputs}>
            {Object.entries(customColors).map(([key, value]) => (
              <div key={key} className={styles.colorInput}>
                <label>
                  {key === "primary" && "주 색상"}
                  {key === "secondary" && "보조 색상"}
                  {key === "accent" && "강조 색상"}
                  {key === "background" && "배경색"}
                  {key === "surface" && "표면색"}
                  {key === "text" && "텍스트"}
                  {key === "textSecondary" && "보조 텍스트"}
                  {key === "border" && "테두리"}
                </label>
                <div className={styles.colorControl}>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) =>
                      setCustomColors((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setCustomColors((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.cancelButton}
              onClick={handleCancelCustomForm}
            >
              취소
            </button>
            <button
              className={styles.saveButton}
              onClick={handleCreateCustomTheme}
              disabled={!customThemeName.trim()}
            >
              테마 생성
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
