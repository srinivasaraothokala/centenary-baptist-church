const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, 'src', 'main.js');
const sermonsSectionPath = path.join(__dirname, 'src', 'components', 'SermonsSection.js');

let mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

if (!mainJsContent.includes('sermonsUpdated')) {
    const targetBlock = `  } catch (err) {
    console.error('Failed to load events:', err);
  }`;
    
    const replacementBlock = `  } catch (err) {
    console.error('Failed to load events:', err);
  }

  // Fetch dynamic sermons
  try {
    const res = await fetch(\`\${API_BASE}/sermons\`);
    if (res.ok) {
      churchData.sermons = await res.json();
      window.dispatchEvent(new Event('sermonsUpdated'));
    }
  } catch (err) {
    console.error('Failed to load sermons:', err);
  }`;

    // fallback to regex if line endings are weird
    const regex = /\} catch \(err\) \{\s*console\.error\('Failed to load events:', err\);\s*\}/;
    mainJsContent = mainJsContent.replace(regex, replacementBlock);

    fs.writeFileSync(mainJsPath, mainJsContent);
    console.log('Updated main.js to fetch sermons');
}

let sermonsContent = fs.readFileSync(sermonsSectionPath, 'utf8');
if (!sermonsContent.includes('sermonsUpdated')) {
    const target = `    window.addEventListener('langChange', () => this.render());
  }`;
    const replacement = `    window.addEventListener('langChange', () => this.render());
    window.addEventListener('sermonsUpdated', () => this.render());
  }`;
    
    sermonsContent = sermonsContent.replace(target, replacement);
    fs.writeFileSync(sermonsSectionPath, sermonsContent);
    console.log('Updated SermonsSection.js to listen to sermonsUpdated');
}
