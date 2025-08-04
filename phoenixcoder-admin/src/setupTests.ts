// 导入测试工具
import { vi } from 'vitest';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';
import '@testing-library/jest-dom';

// 配置测试库
configure({
  testIdAttribute: 'data-testid',
});

// 声明全局变量
declare global {
  var vi: typeof import('vitest').vi;
}

// 设置全局变量
global.vi = vi;

declare const global: any;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
