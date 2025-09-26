import { useRecoilState, useRecoilValue } from 'recoil';
import { currentThemeState, customThemesState, predefinedThemes } from '@store/atoms';
import { Theme } from '@types/index';
import { useEffect } from 'react';

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useRecoilState(currentThemeState);
  const [customThemes, setCustomThemes] = useRecoilState(customThemesState);

  useEffect(() => {
    const root = document.documentElement;
    const theme = currentTheme.colors;

    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);
    root.style.setProperty('--color-border', theme.border);

    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;
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

  return {
    currentTheme,
    allThemes: [...predefinedThemes, ...customThemes],
    selectTheme,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme
  };
};