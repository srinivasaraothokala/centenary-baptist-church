const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.js') && f.startsWith('Admin'));

for (const file of files) {
  if (['AdminUsers.js', 'AdminSiteSettings.js', 'AdminSermons.js', 'AdminLayout.js', 'AdminLogin.js'].includes(file)) continue;

  const filePath = path.join(adminDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  let modified = false;

  // Add import if not present
  if (!content.includes('supabaseClient')) {
    content = content.replace(/(import .* from '..\/apiConfig.js';)/, "$1\nimport { supabaseClient } from '../supabaseFrontendClient.js';");
    modified = true;
  }

  // Add authHeaders helper if not present
  if (!content.includes('authHeaders()')) {
    const classMatch = content.match(/class [a-zA-Z]+ \{/);
    if (classMatch) {
      const helper = `\n  async authHeaders(isFormData = false) {\n    const { data: { session } } = await supabaseClient.auth.getSession();\n    const headers = { Authorization: \`Bearer \${session?.access_token}\` };\n    if (!isFormData) headers['Content-Type'] = 'application/json';\n    return headers;\n  }\n`;
      const constructorRegex = /(constructor\([^)]*\)\s*\{[\s\S]*?\n  \})/;
      if (constructorRegex.test(content)) {
          content = content.replace(constructorRegex, `$1${helper}`);
      } else {
          content = content.replace(classMatch[0], `${classMatch[0]}${helper}`);
      }
      modified = true;
    }
  }

  // Replace fetch calls with headers
  // We need to carefully add headers to POST, PUT, DELETE, PATCH
  // For DELETE (often just URL + method)
  content = content.replace(/fetch\(([^,]+),\s*\{\s*method:\s*'DELETE'\s*\}\s*\)/g, "fetch($1, { method: 'DELETE', headers: await this.authHeaders() })");
  
  // For JSON POST/PUT/PATCH where headers: { 'Content-Type': 'application/json' } is used
  content = content.replace(/headers:\s*\{\s*'Content-Type':\s*'application\/json'\s*\}/g, "headers: await this.authHeaders(false)");

  // For FormData POST where NO headers are specified (like upload)
  // Let's find uploadRes = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData })
  content = content.replace(/fetch\(([^,]+),\s*\{\s*method:\s*['"]POST['"]\s*,\s*body:\s*(formData|fd)\s*\}\s*\)/g, "fetch($1, { method: 'POST', body: $2, headers: await this.authHeaders(true) })");

  // AdminDonations config form:
  // fetch(`${this.API_URL}/config`, { method: 'POST', body: formData })
  content = content.replace(/fetch\(`\$\{this\.API_URL\}\/config`,\s*\{\s*method:\s*'POST',\s*body:\s*formData\s*\}\)/g, "fetch(`${this.API_URL}/config`, { method: 'POST', body: formData, headers: await this.authHeaders(true) })");

  // AdminMinistries reorder:
  // fetch(`${this.API_URL}/reorder`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }) -> already covered by JSON replacement

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
