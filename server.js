const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const LIBRE = 'https://api.libreview.io';
const HEADERS = { 'product': 'llu.ios', 'version': '4.7.0', 'Content-Type': 'application/json' };

app.post('/login', async (req, res) => {
  try {
    const r = await fetch(`${LIBRE}/llu/auth/login`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(req.body)
    });
    const d = await r.json();
    res.json(d);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/data', async (req, res) => {
  const token = req.headers['authorization'];
  try {
    const r = await fetch(`${LIBRE}/llu/connections`, {
      headers: { ...HEADERS, 'Authorization': token }
    });
    const d = await r.json();
    res.json(d);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on ${PORT}`));
