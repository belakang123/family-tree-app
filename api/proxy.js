export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    const body = await response.arrayBuffer();
    return res.status(200).send(Buffer.from(body));
  } catch (error) {
    console.error('Proxy fetch error:', error);
    return res.status(500).json({ error: error.message || 'Failed to proxy URL' });
  }
}
