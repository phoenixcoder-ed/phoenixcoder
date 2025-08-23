# PhoenixCoder 设计规范文档

## 概述

PhoenixCoder 采用宇宙科技风格的设计语言，以深空探索为灵感，构建沉浸式的程序员成长平台界面。设计系统强调科技感、未来感和专业性，通过精心设计的色彩、材质、图形和字体系统，为用户提供极致的视觉体验。

## 🎨 色彩系统

### 基础色彩

#### 背景色系
- **宇宙黑 (Universe Black)**: `#0D0D12`
  - 主要背景色，营造深邃的宇宙空间感
  - 使用场景：页面主背景、导航栏背景

- **月岩灰 (Lunar Gray)**: `#1A1A24`
  - 次级背景色，构建层次感
  - 使用场景：卡片背景、侧边栏、模态框背景

- **星云白 (Nebula White)**: `#F0F4FF`
  - 信息提亮色，确保内容可读性
  - 使用场景：主要文本、图标、分割线

### 交互色系

#### 主色调 - 量子蓝紫渐变
```css
/* 量子蓝紫渐变 */
.quantum-gradient {
  background: linear-gradient(135deg, #6A00FF 0%, #00E4FF 100%);
}
```
- **起始色**: `#6A00FF` (量子紫)
- **结束色**: `#00E4FF` (量子蓝)
- 使用场景：主要按钮、链接、进度条、重要交互元素

#### 辅助色系
- **神经青绿 (Neural Green)**: `#00FFB3`
  - 成功状态、提示信息、积极反馈
  - 使用场景：成功消息、完成状态、技能点亮效果

- **脉冲红橙 (Pulse Red-Orange)**: `#FF5E3A`
  - 警告、错误、紧急状态
  - 使用场景：错误提示、删除操作、截止日期警告

### 文本色系
- **主文本**: `#F0F4FF` (星云白)
- **次要文本**: `#B8C2CC` (中性灰)
- **辅助文本**: `#6B7280` (暗灰)
- **禁用文本**: `#4B5563` (深灰)

## 🔮 材质系统

### 智能玻璃效果

#### 三层结构
1. **基底层**: 12%模糊度磨砂效果
```css
.glass-base {
  backdrop-filter: blur(12px);
  background: rgba(26, 26, 36, 0.8);
}
```

2. **纹理层**: 参数化几何噪点
```css
.geometric-texture {
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(106, 0, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(0, 228, 255, 0.1) 0%, transparent 50%);
  background-size: 60px 60px;
}
```

3. **反光层**: 半透明反光膜
```css
.reflection-layer {
  position: relative;
}
.reflection-layer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(240, 244, 255, 0.3) 50%, transparent 100%);
}
```

### 动态纹理

#### 六边形/三角单元动态重组
```css
@keyframes geometric-shift {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}

.dynamic-geometry {
  animation: geometric-shift 8s ease-in-out infinite;
}
```

#### 电路脉络效果
```css
.circuit-pulse {
  background: linear-gradient(45deg, 
    transparent 30%, 
    rgba(106, 0, 255, 0.3) 50%, 
    transparent 70%
  );
  background-size: 20px 20px;
  animation: circuit-flow 2s linear infinite;
}

@keyframes circuit-flow {
  0% { background-position: 0 0; }
  100% { background-position: 20px 20px; }
}
```

### 液态金属质感
```css
.liquid-metal {
  background: linear-gradient(135deg, 
    rgba(240, 244, 255, 0.1) 0%,
    rgba(106, 0, 255, 0.2) 50%,
    rgba(240, 244, 255, 0.1) 100%
  );
  border: 1px solid rgba(240, 244, 255, 0.2);
  box-shadow: 
    inset 0 1px 0 rgba(240, 244, 255, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.3);
  transform: perspective(1000px) rotateX(15deg);
}
```

## 🌌 图形系统

### 神经突触纹理
```css
.neural-texture {
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(0, 255, 179, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(106, 0, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(0, 228, 255, 0.05) 0%, transparent 50%);
  background-size: 100px 100px, 150px 150px, 80px 80px;
}
```

### 数据流光丝
```css
.data-stream {
  position: relative;
  overflow: hidden;
}

.data-stream::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(0, 228, 255, 0.8) 50%, 
    transparent 100%
  );
  animation: data-flow 2s ease-in-out infinite;
}

@keyframes data-flow {
  0% { left: -100%; }
  100% { left: 100%; }
}
```

### 粒子阵列背景
```css
.particle-grid {
  background-image: 
    radial-gradient(circle at 1px 1px, rgba(240, 244, 255, 0.1) 1px, transparent 0);
  background-size: 20px 20px;
  animation: particle-breathe 4s ease-in-out infinite;
}

@keyframes particle-breathe {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
```

### 路径点亮动效
```css
.path-highlight {
  position: relative;
  transition: all 0.3s ease;
}

.path-highlight:hover::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #6A00FF, #00E4FF);
  transform: translate(-50%, -50%);
  animation: path-expand 0.5s ease-out forwards;
}

@keyframes path-expand {
  0% { width: 0; }
  100% { width: 100%; }
}
```

## ✍️ 字体系统

### 字体族
```css
/* 主字体 - 无衬线字体 */
.font-primary {
  font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 代码字体 - 等宽字体 */
.font-mono {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
}
```

### 字重层级

#### 主标题 (Bold)
```css
.title-primary {
  font-weight: 700;
  color: #F0F4FF;
  text-shadow: 0 0 10px rgba(106, 0, 255, 0.5);
  letter-spacing: -0.5px;
}
```

#### 正文 (Medium)
```css
.text-body {
  font-weight: 500;
  color: #B8C2CC;
  letter-spacing: 0px;
  line-height: 1.6;
}
```

#### 数据标签 (Compressed)
```css
.label-data {
  font-weight: 600;
  color: #00FFB3;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  font-size: 0.875rem;
}
```

### 字间距系统
- **紧密**: `letter-spacing: -0.5px` (大标题)
- **标准**: `letter-spacing: 0px` (正文)
- **宽松**: `letter-spacing: 0.5px` (小标题)
- **扩展**: `letter-spacing: 1.2px` (标签、按钮)

### 行高系统
- **紧密**: `line-height: 1.2` (大标题)
- **标准**: `line-height: 1.6` (正文)
- **宽松**: `line-height: 1.8` (长文本)

## 🎯 组件应用示例

### 按钮组件
```css
.btn-primary {
  background: linear-gradient(135deg, #6A00FF 0%, #00E4FF 100%);
  color: #F0F4FF;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
  backdrop-filter: blur(12px);
  box-shadow: 
    0 4px 12px rgba(106, 0, 255, 0.3),
    inset 0 1px 0 rgba(240, 244, 255, 0.1);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 24px rgba(106, 0, 255, 0.4),
    inset 0 1px 0 rgba(240, 244, 255, 0.2);
}
```

### 卡片组件
```css
.card {
  background: rgba(26, 26, 36, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(240, 244, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(106, 0, 255, 0.5) 50%, 
    transparent 100%
  );
}
```

### 输入框组件
```css
.input {
  background: rgba(13, 13, 18, 0.6);
  border: 1px solid rgba(240, 244, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  color: #F0F4FF;
  font-weight: 500;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.input:focus {
  border-color: rgba(106, 0, 255, 0.5);
  box-shadow: 
    0 0 0 3px rgba(106, 0, 255, 0.1),
    inset 0 1px 0 rgba(240, 244, 255, 0.05);
  outline: none;
}
```

## 📱 响应式设计

### 断点系统
```css
/* 移动端 */
@media (max-width: 768px) {
  .title-primary { font-size: 1.5rem; }
  .card { padding: 16px; }
}

/* 平板端 */
@media (min-width: 769px) and (max-width: 1024px) {
  .title-primary { font-size: 2rem; }
  .card { padding: 20px; }
}

/* 桌面端 */
@media (min-width: 1025px) {
  .title-primary { font-size: 2.5rem; }
  .card { padding: 24px; }
}
```

## 🌟 动画系统

### 缓动函数
```css
:root {
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
  --ease-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 过渡时长
- **快速**: `150ms` (悬停效果)
- **标准**: `300ms` (状态变化)
- **慢速**: `500ms` (页面转场)

## 🎨 主题变量

### CSS 自定义属性
```css
:root {
  /* 颜色变量 */
  --color-universe-black: #0D0D12;
  --color-lunar-gray: #1A1A24;
  --color-nebula-white: #F0F4FF;
  --color-quantum-purple: #6A00FF;
  --color-quantum-blue: #00E4FF;
  --color-neural-green: #00FFB3;
  --color-pulse-red: #FF5E3A;
  
  /* 文本颜色 */
  --text-primary: #F0F4FF;
  --text-secondary: #B8C2CC;
  --text-tertiary: #6B7280;
  --text-disabled: #4B5563;
  
  /* 间距变量 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* 圆角变量 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* 阴影变量 */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.3);
  --shadow-glow: 0 0 20px rgba(106, 0, 255, 0.3);
}
```

## 📋 使用指南

### 实施步骤
1. **引入基础样式**: 导入颜色变量和字体定义
2. **应用材质效果**: 为主要容器添加智能玻璃效果
3. **集成动画系统**: 添加交互动效和过渡效果
4. **测试响应式**: 确保在不同设备上的表现一致

### 最佳实践
- 保持色彩使用的一致性，避免过度使用高饱和度颜色
- 合理使用动画效果，避免影响性能
- 确保文本对比度符合可访问性标准
- 在移动端适当简化视觉效果

### 注意事项
- 智能玻璃效果在低端设备上可能影响性能，需要降级处理
- 动画效果应该可以通过用户偏好设置关闭
- 确保在不同浏览器中的兼容性

---

*本设计规范文档将随着产品迭代持续更新，确保设计系统的一致性和前瞻性。*