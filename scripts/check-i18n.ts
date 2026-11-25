import fs from 'fs'; import path from 'path'; import { dict } from '../lib/i18n';
const files: string[] = []; const walk = (d: string) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (f === 'node_modules' || f === '.next') continue; fs.statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && files.push(p); } };
['app', 'components', 'lib'].forEach(walk);
const used = new Set<string>(); for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/\bt\(\s*['"`]([a-z]+\.[A-Za-z_0-9.]+)['"`]/g)) used.add(m[1]);
const missing = [...used].filter((k) => !(k in dict.en) || !(k in dict.ar)); 
const dyn = ['status.', 'visit.', 'act.', 'day.', 'pt.', 'new.slot'];
console.log('keys used:', used.size, '\nmissing:', missing.filter((k) => !k.endsWith('.')));
