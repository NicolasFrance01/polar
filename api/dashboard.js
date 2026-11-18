import { query } from './db.js';

export default async function handler(req, res) {
  try {
    const clientsCount = await query(`SELECT COUNT(*) FROM clients WHERE active = true`);
    const fiadosSum = await query(`SELECT COALESCE(SUM(fiado_balance), 0)::float as total FROM clients WHERE active = true`);
    
    const deliveredCount = await query(`SELECT COUNT(*) FROM trip_stops WHERE status = 'entregado'`);
    const pendingDeliveriesCount = await query(`SELECT COUNT(*) FROM trip_stops WHERE status = 'pendiente' OR status = 'en_camino'`);
    const absentDeliveriesCount = await query(`SELECT COUNT(*) FROM trip_stops WHERE status = 'ausente' OR status = 'cancelado'`);
    const totalCollected = await query(`SELECT COALESCE(SUM(total), 0)::float as total FROM trip_stops WHERE status = 'entregado'`);
    const emptyContainers = await query(`SELECT COALESCE(SUM(returned_empty), 0)::int as total FROM trip_stops WHERE status = 'entregado'`);
    
    const completedTripsRes = await query(`SELECT COUNT(*) FROM trips WHERE status = 'completado' OR status = 'finalizado'`);
    const pendingOrdersCountRes = await query(`SELECT COUNT(*) FROM orders WHERE status ILIKE '%pendiente%'`);

    // Sum units of products sold
    const itemsRes = await query(`SELECT items FROM trip_stops WHERE status = 'entregado'`);
    let unitsSold = 0;
    for (const row of itemsRes.rows) {
      const items = Array.isArray(row.items) ? row.items : [];
      for (const it of items) {
        unitsSold += Number(it.qty || 0);
      }
    }

    const deliveredDeliveries = parseInt(deliveredCount.rows[0].count, 10);
    const absentDeliveries = parseInt(absentDeliveriesCount.rows[0].count, 10);
    const totalEarningsToday = totalCollected.rows[0].total;
    const totalFiados = fiadosSum.rows[0].total;
    const completedTripsCount = parseInt(completedTripsRes.rows[0].count, 10);
    const pendingOrdersCount = parseInt(pendingOrdersCountRes.rows[0].count, 10);
    const pendingDeliveries = parseInt(pendingDeliveriesCount.rows[0].count, 10);

    const totalVentas = totalEarningsToday + totalFiados;
    const percentCobrado = totalVentas > 0 ? Math.round((totalEarningsToday / totalVentas) * 100) : 0;
    const attemptedStops = deliveredDeliveries + absentDeliveries;
    const deliveryRate = attemptedStops > 0 ? Math.round((deliveredDeliveries / attemptedStops) * 100) : (deliveredDeliveries > 0 ? 100 : 0);

    return res.status(200).json({
      activeClients: parseInt(clientsCount.rows[0].count, 10),
      totalFiados,
      deliveredDeliveries,
      pendingDeliveries,
      absentDeliveries,
      totalEarningsToday,
      emptyContainersReturned: emptyContainers.rows[0].total,
      pendingOrdersCount,
      completedTripsCount,
      unitsSold,
      percentCobrado,
      deliveryRate,
      avgTripTimeMinutes: completedTripsCount > 0 ? 15 : 0
    });
  } catch (error) {
    console.error('API dashboard error:', error);
    return res.status(500).json({ error: error.message });
  }
}
