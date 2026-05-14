export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token, type } = req.query;

    if (!token) {
      return res.status(400).json({ 
        error: 'Token is required',
        usage: '/api/stats?token=YOUR_TOKEN&type=viewstats or /api/stats?token=YOUR_TOKEN&type=hadviewstats'
      });
    }

    // Select API based on type parameter
    let apiUrl;
    if (type === 'hadviewstats') {
      apiUrl = `http://147.135.212.197/crapi/had/viewstats?token=${token}&records=100000`;
    } else {
      // Default to viewstats
      apiUrl = `http://147.135.212.197/crapi/st/viewstats?token=SVFTQTRSQmpHhFhGdpaUYomTZnZmZWRIXoeFRYhvlYVSj42GaWqI&records=25`;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Upstream API error: ${response.statusText}` 
      });
    }

    let data = await response.json();

    // If hadviewstats, convert object response to same array format
    if (type === 'hadviewstats' && data.data) {
      data = data.data.map(item => [
        item.cli,           // Platform (TikTok, FACEBOOK, etc.)
        item.num,           // Number
        item.message,       // Message with code
        item.dt             // Date time
      ]);
    }

    return res.status(200).json(data);

  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout' });
    }
    return res.status(500).json({ error: error.message });
  }
}
