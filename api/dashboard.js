import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const clientsCount = await query(`SELECT COUNT(*) FROM clients WHERE active = true`);
    const fiadosSum = await query(`SELECT COALESCE(SUM(fiado_balance), 0)::float as total FROM clients WHERE active = true`);
    
    const deliveredCount = await query(`SELECT COUNT(*) FROM trip_stops WHERE status = 'entregado'`);
    const pendingCount = await query(`SELECT COUNT(*) FROM trip_stops WHERE status = 'pendiente'`);
    const totalCollected = await query(`SELECT COALESCE(SUM(total), 0)::float as total FROM trip_stops WHERE status = 'entregado'`);
    const emptyContainers = await query(`SELECT COALESCE(SUM(returned_empty), 0)::int as total FROM trip_stops WHERE status = 'entregado'`);
    
    const pendingOrdersCount = await query(`SELECT COUNT(*) FROM orders WHERE status ILIKE '%pendiente%'`);

    return res.status(200).json({
      activeClients: parseInt(clientsCount.rows[0].count, 10),
      totalFiados: fiadosSum.rows[0].total,
      deliveredDeliveries: parseInt(deliveredCount.rows[0].count, 10),
      pendingDeliveries: parseInt(pendingCount.rows[0].count, 10),
      totalEarningsToday: totalCollected.rows[0].total,
      emptyContainersReturned: emptyContainers.rows[0].total,
      pendingOrdersCount: parseInt(pendingOrdersCount.rows[0].count, 10)
    });
  } catch (error) {
    console.error('API dashboard error:', error);
    return res.status(500).json({ error: error.message });
  }
}
