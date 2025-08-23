import React from 'react';

// 基础组件属性类型
export type ComponentProps<T = {}> = T & {
  className?: string;
  children?: React.ReactNode;
};

// 组件引用类型
export type ComponentRef<T = HTMLElement> = React.Ref<T>;

// 组件大小类型
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';

// 组件变体类型
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';

// 组件状态类型
export type ComponentState = 'idle' | 'loading' | 'success' | 'error';

// 响应式属性类型
export type ResponsiveValue<T> = T | {
  base?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
};