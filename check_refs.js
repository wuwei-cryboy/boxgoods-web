const fs = require('fs');
const path = require('path');
process.chdir(__dirname);
const raw = fs.readFileSync('lib/data/catalog.json', 'utf8');
const refs = [...new Set(raw.match(/public\/img\/[^\s" ]+/g) || [])].sort();
const missing = refs.filter(r => !fs.existsSync(path.join('public', r.replace(/^public\//, ''))));
console.log('REFS', refs.length);
console.log('MISSING', missing.length);
missing.slice(0, 500).forEach(x => console.log('MISSING', x));
