import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  globalIgnores(['**/node_modules', '**/dist']),
  // Import plugin configuration
    {
    name: 'eslint-js-recommended-rules',
    plugins: {
      js
    },
    extends: ['js/recommended']
  },
  tseslint.configs.recommended.map((conf) => ({
    ...conf,
    files: ["**/*.ts", "**/*.tsx"],
  })),
  eslintPluginPrettierRecommended,
    {
    name: 'react',
    ...react.configs.flat.recommended
  },
  reactHooks.configs["recommended-latest"],
    {
    ...importPlugin.flatConfigs.recommended,
    globals: {
      ...globals.browser,
      ...globals.node
    },
    rules: {
      // 引号规则
            'quotes': ['error', 'single'],
      // 导入顺序规则
      'import/order': [
        'error',
        {
          'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'pathGroups': [
            {
              'pattern': 'react',
              'group': 'builtin',
              'position': 'before'
            },
            {
              'pattern': '@mui/**',
              'group': 'external',
              'position': 'after'
            }
          ],
          'pathGroupsExcludedImportTypes': ['react'],
          'alphabetize': {
            'order': 'asc',
            'caseInsensitive': true
          },
          'newlines-between': 'always'
        }
      ],
      // 禁止文件扩展名
      'import/extensions': ['error', 'never', {
        'json': 'always'
      }],
      // 其他规则
            'react/react-in-jsx-scope': 'off',
    },
        settings: {
      react: {
        version: 'detect'
      }
    }
  }
]);
