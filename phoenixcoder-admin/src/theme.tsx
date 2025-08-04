import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useState, useEffect, useCallback } from 'react';

// 定义亮色主题
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6',
    },
    secondary: {
      main: '#10b981',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'Inter, JetBrains Mono, sans-serif',
    body1: {
      fontSize: '1rem', // 16px
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          padding: '8px 16px',
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          lineHeight: 1.5,
        },
        h1: {
          fontSize: '2.5rem',
          fontWeight: 700,
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 600,
        },
        h3: {
          fontSize: '1.75rem',
          fontWeight: 600,
        },
        body1: {
          fontSize: '1rem',
        },
        body2: {
          fontSize: '0.875rem',
        },
      },
    },
  },
});

// 定义暗色主题
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
    },
    secondary: {
      main: '#34d399',
    },
    background: {
      default: '#1E1E2F',
      paper: '#2D2D3F',
    },
  },
  typography: {
    fontFamily: 'Inter, JetBrains Mono, sans-serif',
    body1: {
      fontSize: '1rem', // 16px
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.3)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          padding: '8px 16px',
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.4)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          lineHeight: 1.5,
        },
        h1: {
          fontSize: '2.5rem',
          fontWeight: 700,
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 600,
        },
        h3: {
          fontSize: '1.75rem',
          fontWeight: 600,
        },
        body1: {
          fontSize: '1rem',
        },
        body2: {
          fontSize: '0.875rem',
        },
      },
    },
  },
});

// 主题提供器组件
export const ThemeProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // 检查用户偏好的主题并应用
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setThemeMode(prefersDark ? 'dark' : 'light');
  }, []);

  // 应用主题到HTML元素
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  // 切换主题
  const toggleTheme = useCallback(() => {
    setThemeMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {
        // 将切换主题的函数通过上下文传递给子组件
        React.cloneElement(children as React.ReactElement, { toggleTheme } as any)
      }
    </ThemeProvider>
  );
};

// 导出主题配置，供其他组件使用
export { lightTheme, darkTheme };