import React, { useState } from 'react';
import { useTheme } from '@hooks/useTheme';
import { Theme } from '@types/index';
import { v4 as uuidv4 } from 'uuid';
import styles from './ThemeSelector.module.scss';

const ThemeSelector: React.FC = () => {
  const { currentTheme, allThemes, selectTheme, createCustomTheme, deleteCustomTheme } = useTheme();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customThemeName, setCustomThemeName] = useState('');
  const [customColors, setCustomColors] = useState({
    primary: '#FFB6C1',
    secondary: '#FFC0CB',
    accent: '#FFE4E1',
    background: '#FFF8F5',
    surface: '#FFFFFF',
    text: '#4A4A4A',
    textSecondary: '#8B8B8B',
    border: '#F5E6E0'
  });

  const handleCreateCustomTheme = () => {
    if (!customThemeName.trim()) return;

    const newTheme: Theme = {
      id: uuidv4(),
      name: customThemeName,
      colors: customColors
    };

    createCustomTheme(newTheme);
    setShowCustomForm(false);
    setCustomThemeName('');
    selectTheme(newTheme.id);
  };

  const renderThemePreview = (theme: Theme) => {
    return (
      <div
        className={`${styles.themeCard} ${currentTheme.id === theme.id ? styles.selected : ''}`}
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
        {!theme.id.includes('pastel') && (
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
        <h4 className={styles.sectionTitle}>Preset Themes</h4>
        <div className={styles.themeGrid}>
          {allThemes.filter(t => t.id.includes('pastel')).map(theme => renderThemePreview(theme))}
        </div>
      </div>

      {allThemes.filter(t => !t.id.includes('pastel')).length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Custom Themes</h4>
          <div className={styles.themeGrid}>
            {allThemes.filter(t => !t.id.includes('pastel')).map(theme => renderThemePreview(theme))}
          </div>
        </div>
      )}

      {!showCustomForm ? (
        <button
          className={styles.createButton}
          onClick={() => setShowCustomForm(true)}
        >
          + Create Custom Theme
        </button>
      ) : (
        <div className={styles.customForm}>
          <h4 className={styles.formTitle}>Create Custom Theme</h4>

          <div className={styles.formGroup}>
            <label>Theme Name</label>
            <input
              type="text"
              value={customThemeName}
              onChange={(e) => setCustomThemeName(e.target.value)}
              placeholder="Enter theme name"
            />
          </div>

          <div className={styles.colorInputs}>
            {Object.entries(customColors).map(([key, value]) => (
              <div key={key} className={styles.colorInput}>
                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <div className={styles.colorControl}>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => setCustomColors(prev => ({
                      ...prev,
                      [key]: e.target.value
                    }))}
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setCustomColors(prev => ({
                      ...prev,
                      [key]: e.target.value
                    }))}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.cancelButton}
              onClick={() => setShowCustomForm(false)}
            >
              Cancel
            </button>
            <button
              className={styles.saveButton}
              onClick={handleCreateCustomTheme}
              disabled={!customThemeName.trim()}
            >
              Create Theme
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;