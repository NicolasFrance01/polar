import { query } from './db.js';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const result = await query(`
        SELECT id, name, category, size, price::float, pack_price::float, cost::float, 
               returnable, container_type, image, stock_planta, stock_camion, 
               subscription_plan, active, created_at
        FROM products 
        WHERE active = true 
        ORDER BY id ASC
      `);
      return res.status(200).json(result.rows);
    }

    if (method === 'POST') {
      const {
        id, name, category, size, price, pack_price, cost, 
        returnable, container_type, image, stock_planta, stock_camion, subscription_plan
      } = req.body;

      const prodId = id || `prod-${Date.now()}`;
      const result = await query(`
        INSERT INTO products (
          id, name, category, size, price, pack_price, cost, 
          returnable, container_type, image, stock_planta, stock_camion, subscription_plan
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        prodId, name, category, size, price, pack_price || null, cost || null, 
        returnable ?? true, container_type, image, stock_planta || 0, stock_camion || 0, subscription_plan || null
      ]);

      return res.status(201).json(result.rows[0]);
    }

    if (method === 'PUT') {
      const { id } = req.query;
      const {
        name, category, size, price, pack_price, cost, 
        returnable, container_type, image, stock_planta, stock_camion, subscription_plan
      } = req.body;

      const result = await query(`
        UPDATE products 
        SET name = COALESCE($1, name),
            category = COALESCE($2, category),
            size = COALESCE($3, size),
            price = COALESCE($4, price),
            pack_price = COALESCE($5, pack_price),
            cost = COALESCE($6, cost),
            returnable = COALESCE($7, returnable),
            container_type = COALESCE($8, container_type),
            image = COALESCE($9, image),
            stock_planta = COALESCE($10, stock_planta),
            stock_camion = COALESCE($11, stock_camion),
            subscription_plan = COALESCE($12, subscription_plan)
        WHERE id = $13
        RETURNING *
      `, [
        name, category, size, price, pack_price, cost, 
        returnable, container_type, image, stock_planta, stock_camion, subscription_plan, id
      ]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    return res.status(405).json({ error: `Method ${method} not allowed` });
  } catch (error) {
    console.error('API products error:', error);
    return res.status(500).json({ error: error.message });
  }
}
