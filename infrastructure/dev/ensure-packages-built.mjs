// Bouwt @salvemundi/db en @salvemundi/validations als hun dist/ ontbreekt (bv. na een verse clone).
// Daarna houden de watchers in `pnpm dev` ze zelf up-to-date.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const outputs = ['packages/db/dist/index.js', 'packages/validations/dist/index.js'];

if (outputs.some((file) => !existsSync(join(root, file)))) {
    console.log('Workspace-packages nog niet gebouwd, pnpm build:packages draait...');
    execSync('pnpm build:packages', { cwd: root, stdio: 'inherit' });
}
