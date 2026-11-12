import { query } from './db.js';

let schemaEnsured = false;
async function ensureProductColumns() {
  if (schemaEnsured) return;
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`);
  schemaEnsured = true;
}

function mapProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    size: row.size,
    description: row.description || '',
    price: Number(row.price),
    packPrice: row.pack_price != null ? Number(row.pack_price) : null,
    pack_price: row.pack_price != null ? Number(row.pack_price) : null,
    cost: row.cost != null ? Number(row.cost) : null,
    returnable: row.returnable,
    containerType: row.container_type,
    container_type: row.container_type,
    image: row.image || '/images/bidon-20l.png',
    stockPlanta: row.stock_planta ?? 0,
    stock_planta: row.stock_planta ?? 0,
    stockCamion: row.stock_camion ?? 0,
    stock_camion: row.stock_camion ?? 0,
    subscriptionPlan: row.subscription_plan || '',
    subscription_plan: row.subscription_plan || '',
    active: row.active,
    createdAt: row.created_at
  };
}

export default async function handler(req, res) {
  const { method } = req;

  try {
    await ensureProductColumns();

    if (method === 'GET') {
      const result = await query(`
        SELECT id, name, category, size, description, price::float, pack_price::float, cost::float, 
               returnable, container_type, image, stock_planta, stock_camion, 
               subscription_plan, active, created_at
        FROM products 
        WHERE active = true 
        ORDER BY created_at ASC, id ASC
      `);
      return res.status(200).json(result.rows.map(mapProductRow));
    }

    if (method === 'POST') {
      const b = req.body || {};
      const prodId = b.id || `prod-${Date.now()}`;
      const result = await query(`
        INSERT INTO products (
          id, name, category, size, description, price, pack_price, cost, 
          returnable, container_type, image, stock_planta, stock_camion, subscription_plan
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        prodId,
        b.name,
        b.category || 'Agua de Mesa',
        b.size || '',
        b.description || '',
        Number(b.price) || 0,
        b.packPrice ?? b.pack_price ?? null,
        b.cost ?? null,
        b.returnable ?? true,
        b.containerType ?? b.container_type ?? '',
        b.image || '/images/bidon-20l.png',
        Number(b.stockPlanta ?? b.stock_planta ?? 0),
        Number(b.stockCamion ?? b.stock_camion ?? 0),
        b.subscriptionPlan ?? b.subscription_plan ?? null
      ]);

      return res.status(201).json(mapProductRow(result.rows[0]));
    }

    if (method === 'PUT') {
      const { id } = req.query || {};
      const b = req.body || {};
      const targetId = id || b.id;

      if (!targetId) {
        return res.status(400).json({ error: 'Product id required' });
      }

      const result = await query(`
        UPDATE products 
        SET name = COALESCE($1, name),
            category = COALESCE($2, category),
            size = COALESCE($3, size),
            description = COALESCE($4, description),
            price = COALESCE($5, price),
            pack_price = COALESCE($6, pack_price),
            cost = COALESCE($7, cost),
            returnable = COALESCE($8, returnable),
            container_type = COALESCE($9, container_type),
            image = COALESCE($10, image),
            stock_planta = COALESCE($11, stock_planta),
            stock_camion = COALESCE($12, stock_camion),
            subscription_plan = COALESCE($13, subscription_plan)
        WHERE id = $14
        RETURNING *
      `, [
        b.name ?? null,
        b.category ?? null,
        b.size ?? null,
        b.description ?? null,
        b.price !== undefined ? Number(b.price) : null,
        (b.packPrice ?? b.pack_price) !== undefined ? (b.packPrice ?? b.pack_price) : null,
        b.cost !== undefined ? b.cost : null,
        b.returnable !== undefined ? b.returnable : null,
        b.containerType ?? b.container_type ?? null,
        b.image ?? null,
        (b.stockPlanta ?? b.stock_planta) !== undefined ? Number(b.stockPlanta ?? b.stock_planta) : null,
        (b.stockCamion ?? b.stock_camion) !== undefined ? Number(b.stockCamion ?? b.stock_camion) : null,
        b.subscriptionPlan ?? b.subscription_plan ?? null,
        targetId
      ]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.status(200).json(mapProductRow(result.rows[0]));
    }

    if (method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) return res.status(400).json({ error: 'Product id required' });
      await query(`UPDATE products SET active = false WHERE id = $1`, [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: `Method ${method} not allowed` });
  } catch (error) {
    console.error('API products error:', error);
    return res.status(500).json({ error: error.message });
  }
}
