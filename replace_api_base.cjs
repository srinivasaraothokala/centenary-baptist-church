const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function findRelativePath(filePath, targetFile = 'apiConfig.js') {
    const dir = path.dirname(filePath);
    let relPath = path.relative(dir, path.join(srcDir, targetFile)).replace(/\\/g, '/');
    if (!relPath.startsWith('.')) {
        relPath = './' + relPath;
    }
    return relPath;
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.js') && fullPath !== path.join(srcDir, 'apiConfig.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            if (content.includes('http://localhost:3000/api')) {
                // Ensure import exists
                const importStatement = `import { API_BASE } from '${findRelativePath(fullPath)}';\n`;
                if (!content.includes('API_BASE')) {
                    content = importStatement + content;
                }
                
                // Replace string literals: 'http://localhost:3000/api/...' -> `${API_BASE}/...`
                content = content.replace(/'http:\/\/localhost:3000\/api([^']*)'/g, '`${API_BASE}$1`');
                
                // Replace template literals: `http://localhost:3000/api/...` -> `${API_BASE}/...`
                content = content.replace(/`http:\/\/localhost:3000\/api([^`]*)`/g, '`${API_BASE}$1`');

                modified = true;
            }

            // Deal with remaining localhost refs (e.g. image URLs)
            if (content.includes('http://localhost:3000')) {
                 if (!content.includes('API_BASE')) {
                    const importStatement = `import { API_BASE } from '${findRelativePath(fullPath)}';\n`;
                    content = importStatement + content;
                 }
                 // We can use a SERVER_URL which is API_BASE with /api removed, or just `API_BASE.replace('/api', '')`
                 content = content.replace(/http:\/\/localhost:3000/g, '${API_BASE.replace(\'/api\', \'\')}');
                 modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory(srcDir);
console.log('Done');
