require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || '';

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, recaptchaConfigured: Boolean(RECAPTCHA_SECRET) });
});

app.post('/api/auth/verify-recaptcha', async (req, res) => {
  const { token } = req.body || {};

  if (!RECAPTCHA_SECRET) {
    return res.status(503).json({
      success: false,
      error: 'reCAPTCHA secret key is not configured on the server.'
    });
  }

  if (!token) {
    return res.status(400).json({ success: false, error: 'Missing reCAPTCHA token.' });
  }

  try {
    const params = new URLSearchParams({
      secret: RECAPTCHA_SECRET,
      response: token
    });

    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await verifyRes.json();

    if (!data.success) {
      return res.status(400).json({
        success: false,
        error: 'reCAPTCHA validation failed.',
        codes: data['error-codes'] || []
      });
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Server error during reCAPTCHA verification.' });
  }
});

app.listen(PORT, () => {
  console.log(`Grade Portal API listening on http://localhost:${PORT}`);
});
