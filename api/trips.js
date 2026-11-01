import { query } from './db.js';

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const tripsResult = await query(`
        SELECT id, trip_number, driver_name, truck, driver_phone, zone, 
               driver_lat, driver_lng, status, last_update, created_at
        FROM trips 
        ORDER BY trip_number ASC
      `);

      const stopsResult = await query(`
        SELECT id, trip_id, order_number, order_ref, client_id, client_name, address, 
               phone, lat, lng, items, total::float, status, is_next, delivered_at, 
               payment_method, returned_empty, notes, created_at
        FROM trip_stops
        ORDER BY order_number ASC
      `);

      // Group stops by trip_id
      const stopsByTrip = {};
      stopsResult.rows.forEach(stop => {
        if (!stopsByTrip[stop.trip_id]) {
          stopsByTrip[stop.trip_id] = [];
        }
        stopsByTrip[stop.trip_id].push({
          id: stop.id,
          orderNumber: stop.order_number,
          orderRef: stop.order_ref,
          clientName: stop.client_name,
          address: stop.address,
          phone: stop.phone,
          coords: (stop.lat && stop.lng) ? { lat: stop.lat, lng: stop.lng } : null,
          items: stop.items,
          total: stop.total,
          status: stop.status,
          isNext: stop.is_next,
          deliveredAt: stop.delivered_at,
          paymentMethod: stop.payment_method,
          returnedEmpty: stop.returned_empty,
          notes: stop.notes
        });
      });

      const responseObj = {};
      tripsResult.rows.forEach(t => {
        responseObj[t.id] = {
          id: t.id,
          tripNumber: t.trip_number,
          driverName: t.driver_name,
          truck: t.truck,
          driverPhone: t.driver_phone,
          zone: t.zone,
          driverCoords: (t.driver_lat && t.driver_lng) ? { lat: t.driver_lat, lng: t.driver_lng } : null,
          lastUpdate: t.last_update,
          status: t.status,
          stops: stopsByTrip[t.id] || []
        };
      });

      return res.status(200).json(responseObj);
    }

    if (method === 'POST') {
      const { action } = req.body;

      // 1. Update live driver GPS
      if (action === 'update_driver_coords') {
        const { tripId, lat, lng } = req.body;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        await query(`
          UPDATE trips 
          SET driver_lat = $1, driver_lng = $2, last_update = $3
          WHERE id = $4
        `, [lat, lng, timeStr, tripId]);

        return res.status(200).json({ success: true, lastUpdate: timeStr });
      }

      // 2. Update stop status (e.g. delivered, payment, returned empty containers)
      if (action === 'update_stop_status') {
        const { stopId, status, deliveredAt, paymentMethod, returnedEmpty, isNext } = req.body;
        const result = await query(`
          UPDATE trip_stops
          SET status = COALESCE($1, status),
              delivered_at = COALESCE($2, delivered_at),
              payment_method = COALESCE($3, payment_method),
              returned_empty = COALESCE($4, returned_empty),
              is_next = COALESCE($5, is_next)
          WHERE id = $6
          RETURNING *
        `, [status, deliveredAt, paymentMethod, returnedEmpty, isNext, stopId]);

        return res.status(200).json({ success: true, stop: result.rows[0] });
      }

      // 3. Add stop to trip
      if (action === 'add_stop') {
        const { tripId, stop } = req.body;
        const stopId = stop.id || `stop-${Date.now()}`;
        const countRes = await query(`SELECT COUNT(*) FROM trip_stops WHERE trip_id = $1`, [tripId]);
        const orderNum = parseInt(countRes.rows[0].count, 10) + 1;

        await query(`
          INSERT INTO trip_stops (
            id, trip_id, order_number, order_ref, client_name, address, phone, 
            lat, lng, items, total, status, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          stopId, tripId, orderNum, stop.orderRef || null, stop.clientName, stop.address,
          stop.phone, stop.coords?.lat || null, stop.coords?.lng || null,
          JSON.stringify(stop.items || []), stop.total || 0, 'pendiente', stop.notes || ''
        ]);

        return res.status(201).json({ success: true, stopId });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).json({ error: `Method ${method} not allowed` });
  } catch (error) {
    console.error('API trips error:', error);
    return res.status(500).json({ error: error.message });
  }
}
