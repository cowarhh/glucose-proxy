const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/zuckerlive', async (req, res) => {
  const { cookie } = req.body;
  if (!cookie) return res.status(400).json({ error: 'cookie fehlt' });
  try {
    const r = await fetch(`https://www.zuckerlive.de/users/cowar/api.php?ts=${Date.now()}`, {
      headers: {
        'Cookie': `PHPSESSID=${cookie}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.zuckerlive.de/users/cowar/index.php'
      }
    });
    const d = await r.json();
    if (!d.glucose) return res.status(401).json({ error: 'session_abgelaufen' });
    res.json({
      glucose: d.valueInMgPerDl,
      arrow: d.trendArrow,
      timestamp: d.timestamp,
      graph: (d.graph || []).map(p => p.valueInMgPerDl)
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on ${PORT}`));
