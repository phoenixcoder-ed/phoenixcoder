/**
 * 字体加载检测和错误处理工具
 */

import { FONT_SERVICES } from '../config/oauth';

export interface FontLoadResult {
  fontFamily: string;
  loaded: boolean;
  error?: string;
}

/**
 * 字体加载错误处理
 */
export const handleFontLoadError = (
  fontFamily: string,
  error: string
): void => {
  console.warn(`字体 ${fontFamily} 加载失败:`, error);

  // 添加备选字体样式
  const style = document.createElement('style');
  style.textContent = `
    .font-fallback-${fontFamily.replace(/\s+/g, '-').toLowerCase()} {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif !important;
    }
  `;
  document.head.appendChild(style);
};

/**
 * 字体预加载
 */
export const preloadFonts = (): void => {
  const fontUrls = [
    FONT_SERVICES.inter,
    FONT_SERVICES.jetbrainsMono,
    FONT_SERVICES.orbitron,
  ];

  fontUrls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * 检查字体是否可用
 */
export const isFontAvailable = (fontFamily: string): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return false;

    // 设置测试文本
    const testText = 'abcdefghijklmnopqrstuvwxyz0123456789';
    context.font = `16px ${fontFamily}, monospace`;
    const fontWidth = context.measureText(testText).width;

    context.font = '16px monospace';
    const fallbackWidth = context.measureText(testText).width;

    return fontWidth !== fallbackWidth;
  } catch {
    return false;
  }
};

/**
 * 初始化字体检测
 */
export const initFontDetection = (): void => {
  const requiredFonts = ['Inter', 'JetBrains Mono', 'Orbitron'];

  requiredFonts.forEach((font) => {
    if (!isFontAvailable(font)) {
      console.warn(`字体 ${font} 不可用，将使用备选字体`);
      handleFontLoadError(font, '字体不可用');
    } else {
      console.log(`✅ 字体 ${font} 可用`);
    }
  });
};
