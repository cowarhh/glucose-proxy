const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Cache session cookies per user
const sessionCache = {};

async function getSession(email, password) {
  const key = email.toLowerCase();
  
  // Try cached cookie first
  if (sessionCache[key]) {
    const test = await fetch(`https://www.zuckerlive.de/users/cowar/api.php?ts=${Date.now()}`, {
      headers: {
        'Cookie': `PHPSESSID=${sessionCache[key]}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.zuckerlive.de/users/cowar/index.php'
      }
    });
    const d = await test.json();
    if (d.glucose) return sessionCache[key];
  }

  // Login to ZuckerLive
  const loginRes = await fetch('https://www.zuckerlive.de/login.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': 'https://www.zuckerlive.de/login.php'
    },
    body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
    redirect: 'manual'
  });

  // Extract session cookie from response
  const setCookie = loginRes.headers.get('set-cookie') || '';
  const match = setCookie.match(/PHPSESSID=([a-zA-Z0-9]+)/);
  if (!match) throw new Error('Login fehlgeschlagen');
  
  const cookie = match[1];
  sessionCache[key] = cookie;
  return cookie;
}

app.post('/zuckerlive', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'zugangsdaten fehlen' });
  
  try {
    const cookie = await getSession(email, password);
    
    const r = await fetch(`https://www.zuckerlive.de/users/cowar/api.php?ts=${Date.now()}`, {
      headers: {
        'Cookie': `PHPSESSID=${cookie}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.zuckerlive.de/users/cowar/index.php'
      }
    });
    const d = await r.json();
    if (!d.glucose) {
      delete sessionCache[email.toLowerCase()];
      throw new Error('session_abgelaufen');
    }
    
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
