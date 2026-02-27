const http = require('node:http');

const port = Number(process.env.PORT || 4000);

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'wlpapp-api' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      name: 'WLPApp API scaffold',
      endpoints: ['/health']
    })
  );
});

server.listen(port, () => {
  console.log(`WLPApp API listening on http://localhost:${port}`);
});
