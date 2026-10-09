import js from '@eslint/js';
import globals from 'globals';

// DOM sinks that turn data into markup. Site data is rendered with textContent only.
const UNSAFE_SINKS = [
  { selector: "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]", message: 'Usá textContent o createElement: innerHTML/outerHTML abren XSS.' },
  { selector: "CallExpression[callee.property.name='insertAdjacentHTML']", message: 'insertAdjacentHTML abre XSS.' },
  { selector: "CallExpression[callee.object.name='document'][callee.property.name=/^write(ln)?$/]", message: 'document.write está prohibido.' },
  { selector: "CallExpression[callee.property.name='createContextualFragment']", message: 'createContextualFragment abre XSS.' },
];

export default [
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  {
    files: ['site/js/**/*.js'],
    languageOptions: { sourceType: 'module', globals: globals.browser },
    rules: {
      'no-restricted-syntax': ['error', ...UNSAFE_SINKS],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs', '*.config.js'],
    languageOptions: { sourceType: 'module', globals: globals.node },
  },
  {
    files: ['tests/e2e/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
