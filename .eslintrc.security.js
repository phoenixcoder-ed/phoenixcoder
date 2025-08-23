module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  plugins: [
    'security',
    'no-secrets'
  ],
  rules: {
    // 安全相关规则
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-object-injection': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-unsafe-regex': 'error',
    
    // 敏感信息检测
    'no-secrets/no-secrets': ['error', {
      'tolerance': 4.2,
      'ignoreContent': [
        'example',
        'test',
        'mock',
        'placeholder',
        'dummy',
        'fake'
      ],
      'ignoreModules': true,
      'ignoreIdentifiers': [
        'publicKey',
        'testKey',
        'exampleKey'
      ]
    }],
    
    // 防止常见的安全问题
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // 防止原型污染
    'no-proto': 'error',
    'no-extend-native': 'error',
    
    // 防止XSS
    'no-inner-declarations': 'error'
  },
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
};