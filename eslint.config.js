import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended
});

export default [
  js.configs.recommended,
  ...compat.extends('eslint:recommended'),
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module'
    },
    rules: {
      // Code quality rules
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': ['warn', { 
        allow: ['warn', 'error'] 
      }],
      'no-debugger': 'error',
      'no-alert': 'error',
      
      // Best practices
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'prefer-promise-reject-errors': 'error',
      
      // ES6+ features
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': ['error', 'never'],
      'object-shorthand': ['error', 'always'],
      'prefer-destructuring': ['error', {
        array: true,
        object: true
      }, {
        enforceForRenamedProperties: false
      }],
      
      // Style rules (handled by Prettier, but some logical ones)
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { 
        avoidEscape: true,
        allowTemplateLiterals: true 
      }],
      'comma-dangle': ['error', 'never'],
      
      // Import/Export rules
      'no-duplicate-imports': 'error',
      'import/no-unresolved': 'off', // Let SvelteKit handle this
      
      // Async/await rules
      'require-await': 'error',
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'warn',
      'no-promise-executor-return': 'error',
      
      // Error handling
      'no-empty-catch': 'error',
      'no-unsafe-finally': 'error'
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    },
    rules: {
      // Svelte-specific rules
      'svelte/no-at-debug-tags': 'warn',
      'svelte/no-reactive-functions': 'error',
      'svelte/no-reactive-literals': 'error',
      'svelte/prefer-destructuring-props': 'warn',
      'svelte/require-store-reactive-access': 'error',
      'svelte/valid-compile': 'error',
      
      // Accessibility rules
      'svelte/a11y-accesskey': 'error',
      'svelte/a11y-aria-attributes': 'error',
      'svelte/a11y-click-events-have-key-events': 'error',
      'svelte/a11y-img-redundant-alt': 'error',
      'svelte/a11y-label-has-associated-control': 'error',
      'svelte/a11y-media-has-caption': 'error',
      'svelte/a11y-missing-attribute': 'error',
      'svelte/a11y-missing-content': 'error',
      'svelte/a11y-mouse-events-have-key-events': 'error',
      'svelte/a11y-no-redundant-roles': 'error',
      'svelte/a11y-no-interactive-element-to-noninteractive-role': 'error',
      'svelte/a11y-no-noninteractive-element-to-interactive-role': 'error',
      'svelte/a11y-no-noninteractive-tabindex': 'error',
      'svelte/a11y-positive-tabindex': 'error',
      'svelte/a11y-role-has-required-aria-props': 'error',
      'svelte/a11y-role-supports-aria-props': 'error',
      'svelte/a11y-structure': 'error',
      
      // Style consistency
      'svelte/first-attribute-linebreak': ['error', {
        multiline: 'below',
        singleline: 'beside'
      }],
      'svelte/html-closing-bracket-spacing': 'error',
      'svelte/html-quotes': ['error', {
        prefer: 'double',
        dynamic: {
          quoted: false,
          avoidInvalidUnquotedInHTML: false
        }
      }],
      'svelte/indent': ['error', {
        indent: 2,
        ignoredNodes: [],
        switchCase: 1,
        alignAttributesVertically: false
      }],
      'svelte/max-attributes-per-line': ['error', {
        multiline: 1,
        singleline: 3
      }],
      'svelte/mustache-spacing': 'error',
      'svelte/no-spaces-around-equal-signs-in-attribute': 'error',
      'svelte/prefer-class-directive': 'error',
      'svelte/prefer-style-directive': 'error',
      'svelte/shorthand-attribute': 'error',
      'svelte/shorthand-directive': 'error',
      'svelte/sort-attributes': 'off', // Can be too restrictive
      'svelte/spaced-html-comment': 'error'
    }
  },
  {
    files: ['src/routes/**/+*.js', 'src/routes/**/+*.server.js'],
    rules: {
      // SvelteKit route files
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        args: 'after-used'
      }]
    }
  },
  {
    files: ['tests/**/*.js', 'test/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
        ...globals.jest
      }
    },
    rules: {
      // Test files can be more lenient
      'no-unused-expressions': 'off',
      'no-console': 'off'
    }
  },
  {
    ignores: [
      'build/',
      '.svelte-kit/',
      'dist/',
      'node_modules/',
      '*.min.js',
      'coverage/',
      '.env*',
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock'
    ]
  }
];