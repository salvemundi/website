import { defineConfig } from 'tsup';

// In watch mode (`pnpm dev`) dist niet leegmaken, anders ziet Next.js tijdens een rebuild ontbrekende bestanden.
export default defineConfig((options) => ({
  entry: ['src/index.ts', 'src/schema.ts', 'src/relations.ts'],
  format: ['esm'],
  dts: true,
  clean: !options.watch,
  bundle: true,
  splitting: false,
  sourcemap: true,
  outDir: 'dist',
  target: 'node22',
  external: ['drizzle-orm', 'postgres']
}));
