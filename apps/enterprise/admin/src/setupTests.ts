// 导入测试工具
import { TextEncoder, TextDecoder } from 'util';

import { configure } from '@testing-library/react';
import '@testing-library/jest-dom';

// 配置测试库
configure({
  testIdAttribute: 'data-testid',
});

declare const global: {
  TextEncoder: typeof TextEncoder;
  TextDecoder: typeof TextDecoder;
};
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
