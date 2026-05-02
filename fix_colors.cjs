const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
            let content = fs.readFileSync(file, 'utf8');
            if (content.includes('blue-') || content.includes('slate-') || content.includes('zinc-')) {
                const newContent = content
                    .replace(/blue-/g, 'primary-')
                    .replace(/slate-/g, 'gray-')
                    .replace(/zinc-/g, 'gray-');
                if (content !== newContent) {
                    fs.writeFileSync(file, newContent, 'utf8');
                    console.log('Replaced in', file);
                }
            }
        }
    });
    return results;
}

walk('./src');
