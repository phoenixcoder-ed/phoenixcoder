// 导入测试工具
import { TextEncoder, TextDecoder } from 'util';

import { configure } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 配置 Testing Library
configure({ testIdAttribute: 'data-testid' });

declare const global: {
  TextEncoder: typeof TextEncoder;
  TextDecoder: typeof TextDecoder;
};

// 模拟全局对象
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// 模拟 axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    })),
  },
}));

// 模拟 localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// 模拟 window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
});
