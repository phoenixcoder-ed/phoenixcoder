// 组件库常量
export const constants = {
  // 尺寸常量
  sizes: {
    xs: 'xs',
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl',
  } as const,

  // 变体常量
  variants: {
    default: 'default',
    primary: 'primary',
    secondary: 'secondary',
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'info',
  } as const,

  // 主题模式
  themes: {
    light: 'light',
    dark: 'dark',
    auto: 'auto',
  } as const,

  // 位置常量
  positions: {
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
    center: 'center',
    topLeft: 'top-left',
    topRight: 'top-right',
    bottomLeft: 'bottom-left',
    bottomRight: 'bottom-right',
  } as const,

  // 对齐方式
  alignments: {
    left: 'left',
    center: 'center',
    right: 'right',
    justify: 'justify',
  } as const,

  // 断点
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  } as const,

  // Z-index 层级
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  } as const,

  // 动画持续时间
  durations: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 800,
  } as const,

  // 键盘按键
  keys: {
    enter: 'Enter',
    escape: 'Escape',
    space: ' ',
    tab: 'Tab',
    arrowUp: 'ArrowUp',
    arrowDown: 'ArrowDown',
    arrowLeft: 'ArrowLeft',
    arrowRight: 'ArrowRight',
    home: 'Home',
    end: 'End',
    pageUp: 'PageUp',
    pageDown: 'PageDown',
  } as const,

  // 状态
  states: {
    idle: 'idle',
    loading: 'loading',
    success: 'success',
    error: 'error',
    disabled: 'disabled',
  } as const,
};

// 类型导出
export type Size = keyof typeof constants.sizes;
export type Variant = keyof typeof constants.variants;
export type Theme = keyof typeof constants.themes;
export type Position = keyof typeof constants.positions;
export type Alignment = keyof typeof constants.alignments;
export type State = keyof typeof constants.states;