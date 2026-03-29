const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

const targetDir = path.join(__dirname, 'apps/frontend/src');

walkDir(targetDir, function(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix typical React events
    content = content.replace(/\(e: any\)/g, '(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) /* TODO: REVIEW-ANY */');
    content = content.replace(/\(event: any\)/g, '(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) /* TODO: REVIEW-ANY */');
    
    // Fix typical catch blocks (e: any) -> (e: Error | unknown)
    content = content.replace(/catch\s*\(\w+\s*:\s*any\)/g, match => match.replace('any', 'unknown') + ' /* TODO: REVIEW-ANY */');
    
    // Array casts
    content = content.replace(/as any\[\]/g, 'as unknown[] /* TODO: REVIEW-ANY */');
    content = content.replace(/:\s*any\[\]/g, ': unknown[] /* TODO: REVIEW-ANY */');
    
    // Straight generic usage
    content = content.replace(/<any>/g, '<unknown> /* TODO: REVIEW-ANY */');
    
    // 'as any' casting
    content = content.replace(/as any/g, 'as unknown /* TODO: REVIEW-ANY */');
    
    // Variable type definitions
    content = content.replace(/:\s*any(\s*[;,=])/g, ': unknown /* TODO: REVIEW-ANY */$1');
    content = content.replace(/:\s*any\s*\)/g, ': unknown /* TODO: REVIEW-ANY */ )');
    
    // Record<string, any>
    content = content.replace(/Record<string,\s*any>/g, 'Record<string, unknown> /* TODO: REVIEW-ANY */');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Replaced ANYs in ${filePath}`);
    }
});
