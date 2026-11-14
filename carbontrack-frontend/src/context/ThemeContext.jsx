
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('carbontrack_theme') === 'dark'
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    try {
      localStorage.setItem('carbontrack_theme', theme);
    } catch {}
  }, [theme]);

  const changeTheme = useCallback((newTheme, event) => {
    const nextTheme = newTheme === 'dark' ? 'dark' : 'light';

    if (nextTheme === theme) return;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Fallback for browsers without View Transition support
    if (!document.startViewTransition || reduceMotion) {
      setThemeState(nextTheme);
      return;
    }

    // Find the centre of the clicked button
    const rect = event?.currentTarget?.getBoundingClientRect();

    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    // Calculate the radius needed to cover the entire screen
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    root.style.setProperty('--theme-x', `${x}px`);
    root.style.setProperty('--theme-y', `${y}px`);
    root.style.setProperty('--theme-radius', `${radius}px`);

    const transition = document.startViewTransition(() => {
      setThemeState(nextTheme);
    });

    transition.finished.finally(() => {
      root.style.removeProperty('--theme-x');
      root.style.removeProperty('--theme-y');
      root.style.removeProperty('--theme-radius');
    });
  }, [theme]);

  const toggleTheme = useCallback((event) => {
    changeTheme(theme === 'dark' ? 'light' : 'dark', event);
  }, [theme, changeTheme]);

  const setTheme = useCallback((newTheme, event) => {
    changeTheme(newTheme, event);
  }, [changeTheme]);

  const value = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
