import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { build } from 'esbuild';

function collectTsFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

rmSync('dist', { recursive: true, force: true });

await build({
  entryPoints: collectTsFiles('src'),
  outdir: 'dist',
  outbase: 'src',
  bundle: true,
  splitting: true,
  packages: 'external',
  format: 'esm',
  platform: 'node',
  target: 'node22',
  sourcemap: true,
});
