const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const LIBRE = 'https://api.libreview.io';
const HEADERS = { 'product': 'llu.ios', 'version': '4.7.0', 'Content-Type': 'application/json' };

// Login
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

// Data — re-authenticates automatically if token expired
app.post('/data', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Fresh login every request to avoid expired token issues
    const loginRes = await fetch(`${LIBRE}/llu/auth/login`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    const token = loginData?.data?.authTicket?.token;
    if (!token) return res.status(401).json({ error: 'Login fehlgeschlagen' });

    const dataRes = await fetch(`${LIBRE}/llu/connections`, {
      headers: { ...HEADERS, 'Authorization': `Bearer ${token}` }
    });
    const data = await dataRes.json();
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on ${PORT}`));
