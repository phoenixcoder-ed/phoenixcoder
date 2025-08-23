// 动画配置类型
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

// 动画类型
export type AnimationType = 
  | 'fadeIn'
  | 'fadeOut'
  | 'slideIn'
  | 'slideOut'
  | 'scaleIn'
  | 'scaleOut'
  | 'rotateIn'
  | 'rotateOut'
  | 'bounceIn'
  | 'bounceOut'
  | 'elastic'
  | 'spring';

// 动画状态类型
export type AnimationState = 'idle' | 'running' | 'paused' | 'finished';

// 动画事件类型
export interface AnimationEvents {
  onStart?: () => void;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
  onRepeat?: () => void;
}

// 动画选项类型
export interface AnimationOptions extends AnimationConfig, AnimationEvents {
  type: AnimationType;
  target?: string | HTMLElement;
}