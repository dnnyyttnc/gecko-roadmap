import { kv } from '@vercel/kv';

const KV_KEY = 'gecko_roadmap_2026';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const data = await kv.get(KV_KEY);
      if (!data) {
        return res.status(404).json({ error: 'No data found' });
      }
      if (req.query.versionOnly === '1') {
        return res.status(200).json({ version: data.meta ? data.meta.version : 0 });
      }
      return res.status(200).json(data);
    } catch (err) {
      console.error('KV GET error:', err);
      return res.status(500).json({ error: 'Storage read failed' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (!body || !body.meta || typeof body.meta.version !== 'number') {
        return res.status(400).json({ error: 'Invalid payload: missing meta.version' });
      }

      const existing = await kv.get(KV_KEY);
      if (existing && existing.meta && existing.meta.version > body.meta.version) {
        return res.status(409).json({
          error: 'Conflict',
          remoteVersion: existing.meta.version,
          localVersion: body.meta.version
        });
      }

      await kv.set(KV_KEY, body);
      return res.status(200).json({ ok: true, version: body.meta.version });
    } catch (err) {
      console.error('KV POST error:', err);
      return res.status(500).json({ error: 'Storage write failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
