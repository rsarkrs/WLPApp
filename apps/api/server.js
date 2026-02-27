const express = require('express');

const app = express();
const port = Number(process.env.PORT || 4000);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'wlpapp-api' });
});

app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'WLPApp API scaffold',
    endpoints: ['/health']
  });
});

app.listen(port, () => {
  console.log(`WLPApp API listening on http://localhost:${port}`);
});
