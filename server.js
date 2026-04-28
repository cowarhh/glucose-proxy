const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const LIBRE = 'https://api-de.libreview.io';
const HEADERS = { 'product': 'llu.ios', 'version': '4.7.0', 'Content-Type': 'application/json' };

app.post('/data', async (req, res) => {
  const { email, password } = req.body;
  try {
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
