const fs = require('fs');
['src/pages/SermonsPage.js', 'src/admin/AdminSermons.js'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\\\$/g, '$').replace(/\\`/g, '`');
  fs.writeFileSync(f, c);
});
