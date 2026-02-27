const express = require('express');
const { computeBmrTdee } = require('../../src/domain/metabolicEngine');

const app = express();
const port = Number(process.env.PORT || 4000);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'wlpapp-api' });
});

app.get('/v1/metabolic/preview', (req, res) => {
  try {
    const result = computeBmrTdee({
      sex: req.query.sex,
      ageYears: Number(req.query.ageYears),
      heightCm: Number(req.query.heightCm),
      weightKg: Number(req.query.weightKg),
      activityLevel: req.query.activityLevel,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      code: error.code || 'ERR_INVALID_REQUEST',
      message: error.message,
    });
  }
});

app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'WLPApp API scaffold',
    endpoints: ['/health', '/v1/metabolic/preview']
  });
});

app.listen(port, () => {
  console.log(`WLPApp API listening on http://localhost:${port}`);
});
