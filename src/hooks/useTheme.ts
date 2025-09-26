import { useRecoilState, useRecoilValue } from 'recoil';
import { currentThemeState, customThemesState, predefinedThemes } from '@store/atoms';
import { Theme } from '@types';
import { useEffect } from 'react';

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useRecoilState(currentThemeState);
  const [customThemes, setCustomThemes] = useRecoilState(customThemesState);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    const colors = theme.colors;

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-border', colors.border);

    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;
  };

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const selectTheme = (themeId: string) => {
    const allThemes = [...predefinedThemes, ...customThemes];
    const theme = allThemes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
    }
  };

  const createCustomTheme = (theme: Theme) => {
    setCustomThemes(prev => [...prev, theme]);
  };

  const updateCustomTheme = (themeId: string, updates: Partial<Theme>) => {
    setCustomThemes(prev =>
      prev.map(theme =>
        theme.id === themeId ? { ...theme, ...updates } : theme
      )
    );
  };

  const deleteCustomTheme = (themeId: string) => {
    setCustomThemes(prev => prev.filter(theme => theme.id !== themeId));
    if (currentTheme.id === themeId) {
      setCurrentTheme(predefinedThemes[0]);
    }
  };

  // 실시간 미리보기를 위한 임시 테마 적용 함수
  const previewTheme = (colors: Theme['colors']) => {
    const tempTheme: Theme = {
      id: 'preview',
      name: 'Preview',
      colors
    };
    applyTheme(tempTheme);
  };

  // 미리보기 종료 시 원래 테마로 복원
  const resetPreview = () => {
    applyTheme(currentTheme);
  };

  return {
    currentTheme,
    allThemes: [...predefinedThemes, ...customThemes],
    selectTheme,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    previewTheme,
    resetPreview
  };
};