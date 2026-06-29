import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/schema.ts', 'src/relations.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
  outDir: 'dist',
  target: 'node22',
  external: ['drizzle-orm', 'postgres']
});
