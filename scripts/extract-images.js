const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('src/lib/data/catalog.json', 'utf8'));
const images = new Set();

function collectImages(obj) {
  if (typeof obj === 'string' && obj.startsWith('img/')) {
    images.add(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach(collectImages);
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach(collectImages);
  }
}

collectImages(catalog);
console.log([...images].sort().join('\n'));