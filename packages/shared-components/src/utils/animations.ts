import { AnimationType, AnimationConfig } from '../types/animation';

// 动画预设配置
export const animationPresets: Record<AnimationType, AnimationConfig> = {
  fadeIn: {
    duration: 300,
    easing: 'ease-in-out',
  },
  fadeOut: {
    duration: 300,
    easing: 'ease-in-out',
  },
  slideIn: {
    duration: 400,
    easing: 'ease-out',
  },
  slideOut: {
    duration: 400,
    easing: 'ease-in',
  },
  scaleIn: {
    duration: 250,
    easing: 'ease-out',
  },
  scaleOut: {
    duration: 250,
    easing: 'ease-in',
  },
  rotateIn: {
    duration: 500,
    easing: 'ease-out',
  },
  rotateOut: {
    duration: 500,
    easing: 'ease-in',
  },
  bounceIn: {
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  bounceOut: {
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  elastic: {
    duration: 800,
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  spring: {
    duration: 500,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
};

// 动画工具函数
export const animations = {
  // 获取动画预设
  getPreset: (type: AnimationType): AnimationConfig => {
    return animationPresets[type];
  },

  // 创建自定义动画配置
  create: (config: Partial<AnimationConfig>): AnimationConfig => {
    return {
      duration: 300,
      easing: 'ease-in-out',
      ...config,
    };
  },

  // 延迟执行动画
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // 缓动函数
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
    easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
    easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // 动画持续时间预设
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 800,
  },
};