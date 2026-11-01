import { query } from './db.js';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const { search } = req.query || {};
      let sql = `
        SELECT id, name, phone, address, neighborhood, notes, lat, lng,
               containers_held, fiado_balance::float, active, created_at
        FROM clients 
        WHERE active = true
      `;
      const params = [];

      if (search) {
        sql += ` AND (name ILIKE $1 OR address ILIKE $1 OR phone ILIKE $1 OR neighborhood ILIKE $1)`;
        params.push(`%${search}%`);
      }

      sql += ` ORDER BY name ASC`;

      const result = await query(sql, params);
      return res.status(200).json(result.rows);
    }

    if (method === 'POST') {
      const { name, phone, address, neighborhood, notes, lat, lng, containers_held, fiado_balance } = req.body;
      const id = req.body.id || `cli-${Date.now()}`;

      const result = await query(`
        INSERT INTO clients (
          id, name, phone, address, neighborhood, notes, lat, lng, containers_held, fiado_balance
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        id, name, phone, address, neighborhood, notes || '', lat || null, lng || null,
        JSON.stringify(containers_held || { bidon20L: 0, bidon12L: 0, sifon: 0 }),
        fiado_balance || 0
      ]);

      return res.status(201).json(result.rows[0]);
    }

    if (method === 'PUT') {
      const { id } = req.query;
      const { name, phone, address, neighborhood, notes, lat, lng, containers_held, fiado_balance } = req.body;

      const result = await query(`
        UPDATE clients
        SET name = COALESCE($1, name),
            phone = COALESCE($2, phone),
            address = COALESCE($3, address),
            neighborhood = COALESCE($4, neighborhood),
            notes = COALESCE($5, notes),
            lat = COALESCE($6, lat),
            lng = COALESCE($7, lng),
            containers_held = COALESCE($8, containers_held),
            fiado_balance = COALESCE($9, fiado_balance)
        WHERE id = $10
        RETURNING *
      `, [
        name, phone, address, neighborhood, notes, lat, lng,
        containers_held ? JSON.stringify(containers_held) : null,
        fiado_balance, id
      ]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    return res.status(405).json({ error: `Method ${method} not allowed` });
  } catch (error) {
    console.error('API clients error:', error);
    return res.status(500).json({ error: error.message });
  }
}
