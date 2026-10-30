import { readFileSync } from 'node:fs';

const p = 'src/components/ProductView.tsx';
const lines = readFileSync(p, 'utf8').split(/\r?\n/);
let depth = 0;
lines.forEach((l, i) => {
  const n = i + 1;
  const opens = (l.match(/<div\b/g) || []).length;
  const closes = (l.match(/<\/div>/g) || []).length;
  depth += opens - closes;
  const show = (n <= 35) || (n >= 145);
  if (show) {
    console.log(String(n).padStart(3), 'div=' + String(depth).padStart(2), '|', l.trim().slice(0, 80));
  }
});
console.log('--- final div depth:', depth);
