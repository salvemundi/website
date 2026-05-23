/** @type {import('knip').KnipConfig} */
const config = {
  entry: ['src/sw.ts'],
  next: {
    entry: ['src/app/**/*.{ts,tsx}', 'src/pages/**/*.{ts,tsx}', 'next.config.ts']
  },
  exclude: ['exports', 'types'],
  ignoreDependencies: [
    'eslint-config-next',
    '@serwist/sw',
    '@serwist/webpack-plugin'
  ],
  ignoreExportsUsedInFile: false,
};

export default config;
