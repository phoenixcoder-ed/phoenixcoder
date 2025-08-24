import eslint from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
    {
        ignores: [
            // 构建输出
            'dist/',
            'build/',
            '.taro/',
            // 依赖
            'node_modules/',
            // 配置文件
            '*.config.js',
            '*.config.ts',
            'vite.config.js',
            'vitest.config.ts',
            // 生成的文件
            'src/assets/font-icons/',
            // 临时文件
            '.DS_Store',
            '*.log',
        ],
    },
    eslint.configs.recommended,
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                useJSXTextNode: true,
                project: './tsconfig.json',
            },
            globals: {
                // 小程序环境
                wx: 'readonly',
                my: 'readonly',
                swan: 'readonly',
                tt: 'readonly',
                // Node.js 环境
                process: 'readonly',
                global: 'readonly',
                // 浏览器环境
                window: 'readonly',
                document: 'readonly',
                // Taro 相关
                Taro: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': typescriptEslint,
            prettier,
        },
        rules: {
            'no-unused-vars': [
                'error',
                {
                    varsIgnorePattern:
                        'Taro|wx|my|swan|tt|Document|NodeJS|ProcessEnv|afterEach|beforeEach|describe|it|expect|vi|vitest',
                    argsIgnorePattern: '^_',
                },
            ],
            'import/prefer-default-export': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/explicit-member-accessibility': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-var-requires': 'off',
            'prettier/prettier': 'error',
            'no-undef': 'off', // TypeScript 会处理未定义的变量
        },
    },
    // 测试文件特殊配置
    {
        files: ['tests/**/*.{js,jsx,ts,tsx}', '**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
        languageOptions: {
            globals: {
                // Vitest 全局变量
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                vi: 'readonly',
                vitest: 'readonly',
                // Jest DOM
                screen: 'readonly',
                render: 'readonly',
                fireEvent: 'readonly',
                waitFor: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': [
                'error',
                {
                    varsIgnorePattern:
                        'Taro|wx|my|swan|tt|Document|NodeJS|ProcessEnv|afterEach|beforeEach|describe|it|expect|vi|vitest|screen|render|fireEvent|waitFor',
                    argsIgnorePattern: '^_',
                },
            ],
        },
    },
];
