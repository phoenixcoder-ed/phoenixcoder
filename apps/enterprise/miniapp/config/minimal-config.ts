import { defineConfig } from '@tarojs/cli'
import type { UserConfigExport } from '@tarojs/cli'

export default defineConfig({
  projectName: 'phoenixcoder-miniapp',
  framework: 'react',
  compiler: 'webpack5',
} as UserConfigExport)