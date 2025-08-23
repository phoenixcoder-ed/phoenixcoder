import path from 'path'
import { defineConfig } from '@tarojs/cli'
import type { UserConfigExport } from '@tarojs/cli'

const baseConfig: UserConfigExport = {
  projectName: 'phoenixcoder-miniapp',
  date: '2025-8-6',
  designWidth: 750,
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'vite',
}

export default defineConfig(baseConfig)