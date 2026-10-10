// Local dev server: serves the site and API routes. No packages needed (Node 18+).
//   1. Copy .env.example to .env and fill in the API keys.
//   2. Run:  node server.js
//   3. Open: http://localhost:3000   (geolocation works on localhost)
const http = require('http');
const fs = require('fs');
const path = require('path');

// read .env without any package
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(line => {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) { /* no .env file yet */ }

const placesHandler = require('./api/places.js');
const firebaseConfigHandler = require('./api/firebase-config.js');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.webp': 'image/webp' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/places' || url.pathname === '/api/firebase-config') {
    const origin = req.headers.origin;               // lets a page on Live Server (port 5500) call this
    if (origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    req.query = Object.fromEntries(url.searchParams);
    res.status = code => { res.statusCode = code; return res; };
    res.json = obj => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); return res; };
    res.send = body => { res.end(body); return res; };
    return url.pathname === '/api/places'
      ? placesHandler(req, res)
      : firebaseConfigHandler(req, res);
  }

  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/HTMLS/loginpage.html';
  const file = path.normalize(path.join(__dirname, p));
  if (!file.startsWith(__dirname)) { res.statusCode = 403; return res.end('Forbidden'); }
  if (path.basename(file).toLowerCase().startsWith('.env')) { res.statusCode = 403; return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.end(data);
  });
}).listen(process.env.PORT || 3000, () => console.log('Activity Finder running at http://localhost:' + (process.env.PORT || 3000)));
