/** @type {import('knip').KnipConfig} */
const config = {
  next: {
    entry: ['src/app/**/*.{ts,tsx}', 'src/pages/**/*.{ts,tsx}', 'next.config.ts']
  },
  ignore: ['**/*.d.ts', 'src/components/ui/shadcn/**'],
  ignoreDependencies: [
    'eslint-config-next',
    'postcss',
    'tailwindcss',
    '@tailwindcss/postcss',
    'sharp'
  ],
  ignoreExportsUsedInFile: true,
};

export default config;
