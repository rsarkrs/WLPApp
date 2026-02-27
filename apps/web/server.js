const http = require('node:http');

const port = Number(process.env.PORT || 3000);

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>WLPApp</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem; }
      code { background: #f4f4f4; padding: 0.1rem 0.3rem; }
    </style>
  </head>
  <body>
    <h1>WLPApp Web Scaffold</h1>
    <p>Phase 1 scaffold is running.</p>
    <p>Try API health at <code>http://localhost:4000/health</code>.</p>
  </body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(port, () => {
  console.log(`WLPApp web listening on http://localhost:${port}`);
});
