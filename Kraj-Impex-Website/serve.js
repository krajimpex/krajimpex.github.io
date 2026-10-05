// Local preview: `node serve.js`, then open http://localhost:5173
// Applies the same security headers as the host (from _headers), so problems show up before going live.
// Form posts are refused here (there is no form service locally); on Netlify they are received.
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, port = process.env.PORT || 5173;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.json': 'application/json' };

// the "/*" block of _headers
const security = {};
try {
  let on = false;
  for (const line of fs.readFileSync(path.join(root, '_headers'), 'utf8').split(/\r?\n/)) {
    if (/^\S/.test(line)) { on = line.trim() === '/*'; continue; }
    const m = on && line.match(/^\s+([\w-]+):\s*(.+)$/); if (m) security[m[1]] = m[2];
  }
  delete security['Strict-Transport-Security']; delete security['Content-Security-Policy-Report-Only'];
  if (security['Content-Security-Policy']) security['Content-Security-Policy'] = security['Content-Security-Policy'].replace('; upgrade-insecure-requests', '');
} catch (e) { /* no _headers file: serve without */ }

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD', ...security }); return res.end(); }
  let p; try { p = decodeURIComponent(req.url.split('?')[0]); } catch (e) { res.writeHead(400); return res.end(); }
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, path.normalize(p).replace(/^(\.\.[\/\\])+/, ''));
  if (!file.startsWith(root) || /[\\/]\.|serve\.js$/.test(path.relative(root, file))) { res.writeHead(404); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) {
      return fs.readFile(path.join(root, '404.html'), (e2, page) => {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', ...security }); res.end(e2 ? 'Not found' : page);
      });
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...security });
    res.end(data);
  });
}).listen(port, () => console.log('Kraj Impex Diamonds on http://localhost:' + port));
