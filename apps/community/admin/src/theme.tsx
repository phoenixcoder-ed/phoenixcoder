import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';

import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// 创建主题上下文
interface ThemeContextType {
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 自定义 Hook 用于访问主题上下文
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      'useThemeContext must be used within a ThemeProviderWrapper'
    );
  }
  return context;
};

// 定义亮色主题 - PhoenixCoder 宇宙主题
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6A00FF', // Quantum Purple
      light: '#8A2BE2',
      dark: '#4B0082',
    },
    secondary: {
      main: '#00E4FF', // Neural Cyan
      light: '#00FFFF',
      dark: '#0099CC',
    },
    info: {
      main: '#00FFB3', // Neural Cyan-Green
      light: '#66FFCC',
      dark: '#00CC99',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A24',
      secondary: '#6B7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Orbitron", "JetBrains Mono", sans-serif',
    h1: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontFamily: '"Orbitron", sans-serif',
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    body1: {
      fontSize: '1rem', // 16px
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow:
            '0 4px 10px rgba(106, 0, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          border: '1px solid rgba(106, 0, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            boxShadow:
              '0 8px 25px rgba(106, 0, 255, 0.3), 0 4px 10px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-4px)',
            border: '1px solid rgba(106, 0, 255, 0.3)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          padding: '10px 20px',
          fontWeight: 500,
          transition: 'all 0.3s ease',
        },
        contained: {
          background: 'linear-gradient(135deg, #6A00FF 0%, #00E4FF 100%)',
          boxShadow: '0 4px 15px rgba(106, 0, 255, 0.3)',
          border: '1px solid rgba(106, 0, 255, 0.2)',
          '&:hover': {
            background: 'linear-gradient(135deg, #8A2BE2 0%, #00FFFF 100%)',
            boxShadow: '0 6px 20px rgba(106, 0, 255, 0.4)',
            transform: 'translateY(-2px) scale(1.02)',
          },
        },
        outlined: {
          border: '1px solid rgba(106, 0, 255, 0.5)',
          color: '#6A00FF',
          '&:hover': {
            background: 'rgba(106, 0, 255, 0.1)',
            border: '1px solid rgba(106, 0, 255, 0.8)',
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

// 定义暗色主题 - PhoenixCoder 宇宙主题
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8A2BE2', // Quantum Purple (lighter for dark mode)
      light: '#9932CC',
      dark: '#6A00FF',
    },
    secondary: {
      main: '#00E4FF', // Neural Cyan
      light: '#33E7FF',
      dark: '#00B8CC',
    },
    info: {
      main: '#00FFB3', // Neural Cyan-Green
      light: '#33FFCC',
      dark: '#00CC99',
    },
    background: {
      default: '#1A1A24', // Deep Space Dark
      paper: '#262636', // Slightly lighter for cards
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0C0',
    },
  },
  typography: {
    fontFamily: '"Inter", "Orbitron", "JetBrains Mono", sans-serif',
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
export const ThemeProviderWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // 检查用户偏好的主题并应用
  useEffect(() => {
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
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
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    </ThemeProvider>
  );
};

// 导出主题配置，供其他组件使用
export { lightTheme, darkTheme };
