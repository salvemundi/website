/** @type {import('knip').KnipConfig} */
const config = {
  next: {
    entry: ['src/app/**/*.{ts,tsx}', 'src/pages/**/*.{ts,tsx}', 'next.config.ts']
  },
  ignoreDependencies: [
    'eslint-config-next',
    'sharp'
  ],
  ignoreExportsUsedInFile: true,
};

export default config;
