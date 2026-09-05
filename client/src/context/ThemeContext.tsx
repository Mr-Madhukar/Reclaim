import React, { useEffect, useCallback, useMemo } from 'react';
import { ThemeContext, Theme, ThemeContextType } from './ThemeContextCore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('reclaim_theme', 'dark');
  }, []);

  const theme: Theme = 'dark';
  const toggleTheme = useCallback(() => {
    // Dark mode is permanently enforced across the entire application
  }, []);
  const setTheme = useCallback(() => {
    // Dark mode is permanently enforced across the entire application
  }, []);

  const themeContextValue = useMemo<ThemeContextType>(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
