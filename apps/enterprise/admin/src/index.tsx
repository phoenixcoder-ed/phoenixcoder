import React from 'react';

import ReactDOM from 'react-dom/client';

import { App } from './App';
import './index.css';
import { initFontDetection, preloadFonts } from './utils/fontLoader';

// 初始化字体预加载和检测
preloadFonts();

// 在 DOM 加载完成后检测字体
document.addEventListener('DOMContentLoaded', () => {
  initFontDetection();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
