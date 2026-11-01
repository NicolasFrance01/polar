import { query } from './db.js';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const { id } = req.query || {};
      if (id) {
        const result = await query(`
          SELECT id as "orderId", client_name as "clientName", client_phone as "clientPhone",
                 address, neighborhood, notes, lat, lng, items, total::float, status,
                 trip_id as "tripId", created_at as "createdAt"
          FROM orders
          WHERE id = $1
        `, [id]);

        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Order not found' });
        }

        const o = result.rows[0];
        o.coords = (o.lat && o.lng) ? { lat: o.lat, lng: o.lng } : null;
        return res.status(200).json(o);
      }

      const result = await query(`
        SELECT id as "orderId", client_name as "clientName", client_phone as "clientPhone",
               address, neighborhood, notes, lat, lng, items, total::float, status,
               trip_id as "tripId", created_at as "createdAt"
        FROM orders
        ORDER BY created_at DESC
      `);

      const orders = result.rows.map(o => ({
        ...o,
        coords: (o.lat && o.lng) ? { lat: o.lat, lng: o.lng } : null
      }));

      return res.status(200).json(orders);
    }

    if (method === 'POST') {
      const {
        orderId, clientName, clientPhone, address, neighborhood, notes, coords, items, total, status
      } = req.body;

      const id = orderId || `POLAR-${Math.floor(10000 + Math.random() * 90000)}`;

      await query(`
        INSERT INTO orders (
          id, client_name, client_phone, address, neighborhood, notes, lat, lng, items, total, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          client_name = EXCLUDED.client_name,
          client_phone = EXCLUDED.client_phone,
          address = EXCLUDED.address,
          neighborhood = EXCLUDED.neighborhood,
          notes = EXCLUDED.notes,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          items = EXCLUDED.items,
          total = EXCLUDED.total,
          status = EXCLUDED.status
      `, [
        id, clientName, clientPhone, address, neighborhood, notes || '',
        coords?.lat || null, coords?.lng || null,
        JSON.stringify(items || []), total || 0, status || 'Pendiente de aprobación'
      ]);

      return res.status(201).json({
        orderId: id,
        clientName,
        clientPhone,
        address,
        neighborhood,
        notes,
        coords,
        items,
        total,
        status: status || 'Pendiente de aprobación'
      });
    }

    if (method === 'PUT') {
      const { id } = req.query;
      const { status, tripId } = req.body;

      const result = await query(`
        UPDATE orders
        SET status = COALESCE($1, status),
            trip_id = COALESCE($2, trip_id)
        WHERE id = $3
        RETURNING *
      `, [status, tripId, id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    return res.status(405).json({ error: `Method ${method} not allowed` });
  } catch (error) {
    console.error('API orders error:', error);
    return res.status(500).json({ error: error.message });
  }
}
