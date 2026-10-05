// Builds the folder to upload to a host: `node build.js` → dist/
// Copies only what the public site needs (pages, assets, _headers, robots.txt), leaving out
// local tools (serve.js, build.js, README, editor settings).
const fs = require('fs'), path = require('path');
const root = __dirname, out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
const keep = f => /\.html$/.test(f) || f === '_headers' || f === 'robots.txt';
for (const f of fs.readdirSync(root)) if (keep(f)) fs.copyFileSync(path.join(root, f), path.join(out, f));
fs.cpSync(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });
const count = d => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);
console.log('dist/ ready: ' + count(out) + ' files. Upload the dist folder.');
