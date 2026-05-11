export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.query;

    // Validate token
    if (!token) {
      return res.status(400).json({ error: 'Token parameter is required' });
    }

    // Fetch data from the external API
    const response = await fetch(
      `http://147.135.212.197/crapi/st/viewstats?token=${token}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Upstream API error: ${response.statusText}`,
      });
    }

    const data = await response.json();

    // Return the data
    return res.status(200).json(data);

  } catch (error) {
    console.error('API Error:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout' });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
