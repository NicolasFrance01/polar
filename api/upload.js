import { put, get } from '@vercel/blob';
import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN no está configurado en el servidor.' });
  }

  // Serve private blob images seamlessly via /api/upload?blob=<url>
  if (req.method === 'GET') {
    try {
      const { blob: blobUrl } = req.query || {};
      if (!blobUrl) {
        return res.status(400).json({ error: 'Falta parámetro blob' });
      }
      const result = await get(blobUrl, { access: 'private', token });
      if (!result || !result.stream) {
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }
      const arrayBuf = await new Response(result.stream).arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      res.statusCode = 200;
      res.setHeader('Content-Type', result.blob?.contentType || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.end(buf);
    } catch (error) {
      console.error('API blob proxy error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { filename, contentType, base64 } = req.body || {};
    if (!base64 || !filename) {
      return res.status(400).json({ error: 'Se requiere filename y contenido base64 de la imagen.' });
    }

    const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    const buffer = Buffer.from(cleanBase64, 'base64');

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `products/${Date.now()}-${safeName}`;

    let blob;
    let isPrivate = false;
    try {
      blob = await put(pathname, buffer, {
        access: 'public',
        contentType: contentType || 'image/png',
        token
      });
    } catch (pubErr) {
      if (String(pubErr.message || '').toLowerCase().includes('private')) {
        blob = await put(pathname, buffer, {
          access: 'private',
          contentType: contentType || 'image/png',
          token
        });
        isPrivate = true;
      } else {
        throw pubErr;
      }
    }

    const displayUrl = isPrivate
      ? `/api/upload?blob=${encodeURIComponent(blob.url)}`
      : blob.url;

    return res.status(200).json({
      success: true,
      url: displayUrl,
      rawUrl: blob.url,
      pathname: blob.pathname,
      access: isPrivate ? 'private' : 'public'
    });
  } catch (error) {
    console.error('API upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}
