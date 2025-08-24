// 重新导出 ThemeProvider 中的 useTheme hook
export { useTheme } from '../components/providers/ThemeProvider';

// 额外的主题相关 hooks
export function useSystemTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function useThemeClass() {
  const isDark = document.documentElement.classList.contains('dark');
  const isLight = document.documentElement.classList.contains('light');
  
  return {
    isDark,
    isLight,
    theme: isDark ? 'dark' : isLight ? 'light' : 'system',
  };
}