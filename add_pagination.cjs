const fs = require('fs');
const path = require('path');

const routesToUpdate = [
    'eventsRoutes.js',
    'sermonRoutes.js',
    'ministriesRoutes.js',
    'campusRoutes.js',
    'leadershipRoutes.js',
    'galleryRoutes.js'
];

for (const file of routesToUpdate) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');

    // Find the GET / route handler
    const getRouteRegex = /router\.get\('\/', (requireAuth, )?async \(req, res\) => \{\s*try \{\s*(const \{ data, error \} = await supabase[^;]+;)/m;
    
    const match = content.match(getRouteRegex);
    if (match) {
        const originalQuery = match[3];
        let newQuery = originalQuery;
        
        // Append .range(from, to) if it doesn't already have it
        if (!newQuery.includes('.range(')) {
            newQuery = newQuery.replace(';', '.range(from, to);');
            
            const replacement = `const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    ${newQuery}`;
            
            content = content.replace(originalQuery, replacement);
            fs.writeFileSync(filePath, content);
            console.log(`Updated ${file}`);
        } else {
            console.log(`Skipped ${file}, already paginated`);
        }
    } else {
        console.log(`Could not match GET / in ${file}`);
    }
}
