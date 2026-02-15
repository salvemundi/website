const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

walk('./src', (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Handle single import of getImageUrl
    content = content.replace(/import\s*\{\s*getImageUrl\s*\}\s*from\s*['"]@\/shared\/lib\/api\/salvemundi['"];?/g,
        "import { getImageUrl } from '@/shared/lib/api/image';");

    // 2. Handle multi-import with getImageUrl
    if (content.includes('getImageUrl') && content.includes('@/shared/lib/api/salvemundi')) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('getImageUrl') && lines[i].includes('@/shared/lib/api/salvemundi')) {
                let line = lines[i];
                // Check if it's a multi-import or single
                if (line.includes(',') || line.match(/import\s*\{\s*getImageUrl\s*,\s*.*\}/)) {
                    // It's a multi-import. Remove getImageUrl from it.
                    let newLine = line.replace(/getImageUrl\s*,\s*/, '').replace(/,\s*getImageUrl/, '');
                    lines[i] = newLine + "\nimport { getImageUrl } from '@/shared/lib/api/image';";
                }
            }
        }
        content = lines.join('\n');
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated: ${filePath}`);
    }
});
