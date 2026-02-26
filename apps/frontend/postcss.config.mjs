import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    plugins: {
        '@tailwindcss/postcss': {
            base: join(__dirname, 'src'),
        },
    },
};
