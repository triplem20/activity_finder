
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const key = process.env.FOURSQUARE_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'Server is missing FOURSQUARE_API_KEY' });
    return;
  }

  const { ll, query = '', limit = '20' } = req.query;
  if (!/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(ll || '')) {
    res.status(400).json({ error: 'll must look like "lat,lng"' });
    return;
  }

  const params = new URLSearchParams({
    ll,
    limit: String(Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50))
  });
  if (query) params.set('query', String(query).slice(0, 60));

  try {
    const upstream = await fetch('https://places-api.foursquare.com/places/search?' + params, {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + key,
        'X-Places-Api-Version': '2025-06-17'
      }
    });
    const body = await upstream.text();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(upstream.status).send(body);
  } catch (err) {
    res.status(502).json({ error: 'Could not reach the places service' });
  }
};
