module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    browser: true,
  },
  extends: ['airbnb-base', 'plugin:node/recommended'],
  plugins: ['node'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  rules: {
    'no-console': 'warn',
    'no-shadow': 'error',

    'comma-dangle': ['error', 'never'],
    'no-plusplus': ['error', { 'allowForLoopAfterthoughts': true }],
    'no-await-in-loop': 'warn',

    'no-underscore-dangle': ['error', {
      allow: ['_client'],
      allowAfterThis: false,
      allowAfterSuper: false,
      enforceInMethodNames: false,
    }],
  },
};
