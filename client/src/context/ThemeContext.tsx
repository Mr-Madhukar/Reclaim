import React, { useEffect } from 'react';
import { ThemeContext, Theme } from './ThemeContextCore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('reclaim_theme', 'dark');
  }, []);

  const theme: Theme = 'dark';
  const toggleTheme = () => {
    // Dark mode is permanently enforced across the entire application
  };
  const setTheme = () => {
    // Dark mode is permanently enforced across the entire application
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
