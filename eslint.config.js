import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: [
    'dist',
    '*.js',
    'fix-migration.js',
    'migration-fixer-script.ts',
    'scripts/deploy.ts',
    'vite.config.ts',
    'vitest.config.ts',
    '**/*.config.js',
    '**/*.config.ts',
    'scripts/**/*',
    '.husky/**/*',
    '**/*.-Backup*.tsx',
    '**/*.-Backup*.ts',
    '**/backup/**/*',
    'src/supabase/migrations/**/*',
    'supabase/functions/**/*',
    'supabase/migrations/**/*',
    'src/utils/automated-tests.ts',
    'src/utils/testWatcher.ts'
  ] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Catch syntax errors
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-duplicate-case': 'error',
      // TypeScript specific
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      // React specific
      'react-hooks/exhaustive-deps': 'error',
      // String/quote consistency
      'quotes': ['error', 'single'],
      'jsx-quotes': ['error', 'prefer-double'],
      // Semicolons
      'semi': ['error', 'always'],
      // Catch common mistakes
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'warn',
    },
  }
);
