import { query } from './db.js';

let schemaEnsured = false;
async function ensureTripColumns() {
  if (schemaEnsured) return;
  await query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;`);
  await query(`ALTER TABLE trips ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';`);
  await query(`ALTER TABLE trip_stops ADD COLUMN IF NOT EXISTS skip_reason TEXT DEFAULT '';`);
  await query(`ALTER TABLE trip_stops ADD COLUMN IF NOT EXISTS returned_containers JSONB DEFAULT '[]'::jsonb;`);
  schemaEnsured = true;
}

export default async function handler(req, res) {
  const { method } = req;

  try {
    await ensureTripColumns();

    if (method === 'GET') {
      const { tripNumber, tripId } = req.query || {};

      let tripsSql = `
        SELECT id, trip_number, driver_name, truck, driver_phone, zone, 
               driver_lat, driver_lng, status, last_update, notes, created_at, completed_at
        FROM trips 
      `;
      const tripParams = [];
      if (tripNumber) {
        tripsSql += ` WHERE trip_number = $1 `;
        tripParams.push(parseInt(tripNumber, 10));
      } else if (tripId) {
        tripsSql += ` WHERE id = $1 `;
        tripParams.push(tripId);
      }
      tripsSql += ` ORDER BY trip_number DESC`;

      const tripsResult = await query(tripsSql, tripParams);

      let stopsSql = `
        SELECT id, trip_id, order_number, order_ref, client_id, client_name, address, 
               phone, lat, lng, items, total::float, status, is_next, delivered_at, 
               payment_method, returned_empty, returned_containers, notes, skip_reason, created_at
        FROM trip_stops
      `;
      const stopParams = [];
      if (tripsResult.rows.length === 1 && (tripNumber || tripId)) {
        stopsSql += ` WHERE trip_id = $1 `;
        stopParams.push(tripsResult.rows[0].id);
      }
      stopsSql += ` ORDER BY order_number ASC`;

      const stopsResult = await query(stopsSql, stopParams);

      const stopsByTrip = {};
      stopsResult.rows.forEach(stop => {
        if (!stopsByTrip[stop.trip_id]) {
          stopsByTrip[stop.trip_id] = [];
        }
        stopsByTrip[stop.trip_id].push({
          id: stop.id,
          orderNumber: stop.order_number,
          orderRef: stop.order_ref,
          clientId: stop.client_id,
          clientName: stop.client_name,
          address: stop.address,
          phone: stop.phone,
          coords: (stop.lat != null && stop.lng != null) ? { lat: stop.lat, lng: stop.lng } : null,
          items: stop.items || [],
          total: stop.total,
          status: stop.status,
          isNext: stop.is_next,
          deliveredAt: stop.delivered_at,
          paymentMethod: stop.payment_method,
          returnedEmpty: stop.returned_empty,
          returnedContainers: stop.returned_containers || [],
          notes: stop.notes,
          skipReason: stop.skip_reason || ''
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
          driverCoords: (t.driver_lat != null && t.driver_lng != null) ? { lat: t.driver_lat, lng: t.driver_lng } : null,
          lastUpdate: t.last_update,
          status: t.status,
          notes: t.notes || '',
          createdAt: t.created_at,
          completedAt: t.completed_at,
          stops: stopsByTrip[t.id] || []
        };
      });

      return res.status(200).json(responseObj);
    }

    if (method === 'POST') {
      const { action } = req.body || {};

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

      // 2. Update stop status (delivered, ausente, cancelado, pendiente, etc.) + optional GPS + auto-advance next
      if (action === 'update_stop_status') {
        const {
          tripId,
          stopId,
          status,
          deliveredAt,
          paymentMethod,
          returnedEmpty,
          returnedContainers,
          items,
          total,
          isNext,
          notes,
          skipReason,
          driverLat,
          driverLng
        } = req.body;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const itemsJson = items ? JSON.stringify(items) : null;
        const totalNum = total != null ? Number(total) : null;
        const returnedContainersJson = returnedContainers ? JSON.stringify(returnedContainers) : null;

        const result = await query(`
          UPDATE trip_stops
          SET status = COALESCE($1, status),
              delivered_at = COALESCE($2, delivered_at),
              payment_method = COALESCE($3, payment_method),
              returned_empty = COALESCE($4, returned_empty),
              is_next = COALESCE($5, is_next),
              notes = COALESCE($6, notes),
              skip_reason = COALESCE($7, skip_reason),
              items = COALESCE($8, items),
              total = COALESCE($9, total),
              returned_containers = COALESCE($10, returned_containers)
          WHERE id = $11
          RETURNING *
        `, [
          status ?? null,
          deliveredAt ?? null,
          paymentMethod ?? null,
          returnedEmpty ?? null,
          isNext ?? null,
          notes ?? null,
          skipReason ?? null,
          itemsJson,
          totalNum,
          returnedContainersJson,
          stopId
        ]);

        const updatedStop = result.rows[0];
        const targetTripId = tripId || updatedStop?.trip_id;

        // If stop is resolved (entregado, ausente, cancelado), clear is_next on it and advance to next pending stop if none is_next
        if (targetTripId && ['entregado', 'ausente', 'cancelado'].includes(status)) {
          await query(`UPDATE trip_stops SET is_next = false WHERE id = $1`, [stopId]);
          const nextPending = await query(`
            SELECT id FROM trip_stops 
            WHERE trip_id = $1 AND status IN ('pendiente', 'en_camino')
            ORDER BY order_number ASC
            LIMIT 1
          `, [targetTripId]);

          if (nextPending.rowCount > 0) {
            await query(`UPDATE trip_stops SET is_next = true, status = 'en_camino' WHERE id = $1`, [nextPending.rows[0].id]);
          }
        }

        // Sync order status if linked via order_ref
        if (updatedStop?.order_ref && status === 'entregado') {
          if (itemsJson || totalNum != null) {
            await query(`UPDATE orders SET status = 'Entregado', items = COALESCE($1, items), total = COALESCE($2, total) WHERE id = $3`, [itemsJson, totalNum, updatedStop.order_ref]).catch(() => { });
          } else {
            await query(`UPDATE orders SET status = 'Entregado' WHERE id = $1`, [updatedStop.order_ref]).catch(() => { });
          }
        } else if (updatedStop?.order_ref && status === 'cancelado') {
          await query(`UPDATE orders SET status = 'Cancelado' WHERE id = $1`, [updatedStop.order_ref]).catch(() => { });
        }

        // If paid with Fiado, update client's fiado balance
        if (paymentMethod === 'Fiado' && updatedStop?.client_id && totalNum > 0) {
          await query(`UPDATE clients SET fiado_balance = fiado_balance + $1 WHERE id = $2`, [totalNum, updatedStop.client_id]).catch(() => { });
        }

        // When delivered, sync containers held & delivery history on the client
        if (status === 'entregado' && updatedStop?.client_id) {
          try {
            const clientRes = await query(`SELECT id, containers_held, delivery_history FROM clients WHERE id = $1`, [updatedStop.client_id]);
            if (clientRes.rows.length > 0) {
              const cli = clientRes.rows[0];
              let held = cli.containers_held || { bidon20L: 0, bidon12L: 0, sifon: 0 };
              if (typeof held === 'string') {
                try { held = JSON.parse(held); } catch { held = { bidon20L: 0, bidon12L: 0, sifon: 0 }; }
              }
              let history = cli.delivery_history || [];
              if (typeof history === 'string') {
                try { history = JSON.parse(history); } catch { history = []; }
              }
              if (!Array.isArray(history)) history = [];

              const parsedItems = Array.isArray(items) ? items : [];
              let del20 = 0, del12 = 0, delSif = 0;
              parsedItems.forEach(it => {
                const n = (it.name || '').toLowerCase();
                const q = Number(it.qty) || 0;
                if (n.includes('20')) del20 += q;
                else if (n.includes('12')) del12 += q;
                else if (n.includes('sif') || n.includes('soda')) delSif += q;
              });

              const parsedReturned = Array.isArray(returnedContainers) ? returnedContainers : [];
              let ret20 = 0, ret12 = 0, retSif = 0;
              parsedReturned.forEach(rc => {
                const n = (rc.name || rc.type || '').toLowerCase();
                const q = Number(rc.qty) || 0;
                if (n.includes('20')) ret20 += q;
                else if (n.includes('12')) ret12 += q;
                else if (n.includes('sif') || n.includes('soda')) retSif += q;
              });

              held.bidon20L = Math.max(0, (Number(held.bidon20L) || 0) + del20 - ret20);
              held.bidon12L = Math.max(0, (Number(held.bidon12L) || 0) + del12 - ret12);
              held.sifon = Math.max(0, (Number(held.sifon) || 0) + delSif - retSif);

              const deliveryEntry = {
                id: `del-${Date.now()}`,
                date: new Date().toLocaleDateString('es-AR') + ' ' + (deliveredAt || timeStr),
                tripId: targetTripId,
                itemsDelivered: parsedItems,
                returnedContainers: parsedReturned,
                totalEmpty: returnedEmpty || 0,
                totalPaid: totalNum || 0,
                paymentMethod: paymentMethod || 'Efectivo'
              };

              history.unshift(deliveryEntry);

              await query(
                `UPDATE clients SET containers_held = $1, delivery_history = $2 WHERE id = $3`,
                [JSON.stringify(held), JSON.stringify(history), updatedStop.client_id]
              ).catch(() => {});
            }
          } catch (err) {
            console.warn('Postgres client sync error in trip_stops:', err);
          }

          // Increment empty containers stock on truck in products table
          if (Array.isArray(returnedContainers)) {
            for (const rc of returnedContainers) {
              const q = Number(rc.qty) || 0;
              if (q > 0) {
                const n = (rc.name || rc.type || '').toLowerCase();
                let pattern = '%20%';
                if (n.includes('12')) pattern = '%12%';
                else if (n.includes('sif') || n.includes('soda')) pattern = '%sif%';
                await query(
                  `UPDATE products SET stock_vacios_camion = COALESCE(stock_vacios_camion, 0) + $1 WHERE name ILIKE $2 OR container_type ILIKE $2`,
                  [q, pattern]
                ).catch(() => {});
              }
            }
          }
        }

        // Also update driver GPS coordinates & last_update on trips if provided
        if (targetTripId) {
          if (driverLat != null && driverLng != null) {
            await query(
              `UPDATE trips SET driver_lat = $1, driver_lng = $2, last_update = $3 WHERE id = $4`,
              [driverLat, driverLng, timeStr, targetTripId]
            );
          } else {
            await query(`UPDATE trips SET last_update = $1 WHERE id = $2`, [timeStr, targetTripId]);
          }
        }

        return res.status(200).json({ success: true, stop: updatedStop, lastUpdate: timeStr });
      }

      // 3. Jump to / select any stop as NEXT STOP (non-linear routing)
      if (action === 'set_next_stop') {
        const { tripId, stopId, driverLat, driverLng } = req.body;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        await query(`UPDATE trip_stops SET is_next = false WHERE trip_id = $1`, [tripId]);
        await query(
          `UPDATE trip_stops 
           SET is_next = true, 
               status = CASE WHEN status IN ('pendiente', 'ausente') THEN 'en_camino' ELSE status END
           WHERE id = $1 AND trip_id = $2`,
          [stopId, tripId]
        );

        if (driverLat != null && driverLng != null) {
          await query(
            `UPDATE trips SET driver_lat = $1, driver_lng = $2, last_update = $3 WHERE id = $4`,
            [driverLat, driverLng, timeStr, tripId]
          );
        } else {
          await query(`UPDATE trips SET last_update = $1 WHERE id = $2`, [timeStr, tripId]);
        }

        return res.status(200).json({ success: true, lastUpdate: timeStr });
      }

      // 4. Add stop to existing trip
      if (action === 'add_stop') {
        const { tripId, stop } = req.body;
        if (!tripId || !stop) {
          return res.status(400).json({ error: 'tripId y stop son requeridos' });
        }
        const stopId = stop.id || `stop-${Date.now()}`;
        const countRes = await query(`SELECT COALESCE(MAX(order_number), 0) as max_num FROM trip_stops WHERE trip_id = $1`, [tripId]);
        const orderNum = parseInt(countRes.rows[0].max_num, 10) + 1;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const insertedRes = await query(`
          INSERT INTO trip_stops (
            id, trip_id, order_number, order_ref, client_id, client_name, address, phone, 
            lat, lng, items, total, status, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `, [
          stopId, tripId, orderNum, stop.orderRef || null, stop.clientId || null,
          stop.clientName, stop.address, stop.phone || '',
          stop.coords?.lat || null, stop.coords?.lng || null,
          JSON.stringify(stop.items || []), Number(stop.total) || 0, 'pendiente', stop.notes || ''
        ]);

        if (stop.orderRef) {
          await query(`UPDATE orders SET trip_id = $1, status = 'En reparto' WHERE id = $2`, [tripId, stop.orderRef]).catch(() => {});
        }

        await query(`UPDATE trips SET last_update = $1 WHERE id = $2`, [timeStr, tripId]).catch(() => {});

        const inserted = insertedRes.rows[0];
        const formattedStop = {
          id: inserted.id,
          orderNumber: inserted.order_number,
          orderRef: inserted.order_ref,
          clientId: inserted.client_id,
          clientName: inserted.client_name,
          address: inserted.address,
          phone: inserted.phone,
          coords: (inserted.lat != null && inserted.lng != null) ? { lat: inserted.lat, lng: inserted.lng } : null,
          items: inserted.items || [],
          total: Number(inserted.total) || 0,
          status: inserted.status,
          isNext: false,
          notes: inserted.notes || ''
        };

        return res.status(201).json({ success: true, stopId, stop: formattedStop, lastUpdate: timeStr });
      }

      // 5. Create new trip (Hoja de Ruta #XX) from selected orders
      if (action === 'create_trip') {
        const { driverName, driverPhone, truck, zone, notes, stops, initialCoords } = req.body;
        if (!driverName || !Array.isArray(stops) || stops.length === 0) {
          return res.status(400).json({ error: 'Se requiere chofer y al menos un pedido seleccionado.' });
        }

        const maxNumRes = await query(`SELECT COALESCE(MAX(trip_number), 24) as max_num FROM trips`);
        const nextTripNumber = parseInt(maxNumRes.rows[0].max_num, 10) + 1;
        const tripId = `VIAJE-${nextTripNumber}`;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Initial truck coordinates: user/driver origin or default Córdoba center
        const initialLat = (initialCoords?.lat != null) ? Number(initialCoords.lat) : -31.4170;
        const initialLng = (initialCoords?.lng != null) ? Number(initialCoords.lng) : -64.1830;

        await query(`
          INSERT INTO trips (id, trip_number, driver_name, truck, driver_phone, zone, driver_lat, driver_lng, status, last_update, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_curso', $9, $10)
        `, [
          tripId,
          nextTripNumber,
          driverName,
          truck || 'Camión Reparto Polar',
          driverPhone || '',
          zone || 'Reparto General',
          initialLat,
          initialLng,
          timeStr,
          notes || ''
        ]);

        for (let i = 0; i < stops.length; i++) {
          const s = stops[i];
          const stopId = `stop-${nextTripNumber}-${i + 1}-${Date.now()}`;
          const isFirst = i === 0;
          await query(`
            INSERT INTO trip_stops (
              id, trip_id, order_number, order_ref, client_id, client_name, address, phone,
              lat, lng, items, total, status, is_next, payment_method, returned_empty, notes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          `, [
            stopId,
            tripId,
            i + 1,
            s.orderRef || s.orderId || null,
            s.clientId || null,
            s.clientName,
            s.address,
            s.phone || s.clientPhone || '',
            s.coords?.lat ?? null,
            s.coords?.lng ?? null,
            JSON.stringify(s.items || []),
            Number(s.total) || 0,
            isFirst ? 'en_camino' : 'pendiente',
            isFirst,
            s.paymentMethod || 'Efectivo',
            0,
            s.notes || ''
          ]);

          if (s.orderRef || s.orderId) {
            const ordId = s.orderRef || s.orderId;
            await query(
              `UPDATE orders SET status = 'Aprobado y en hoja de ruta', trip_id = $1 WHERE id = $2`,
              [tripId, ordId]
            ).catch(() => { });
          }
        }

        return res.status(201).json({
          success: true,
          tripId,
          tripNumber: nextTripNumber,
          routePath: `/ruta${nextTripNumber}`
        });
      }

      // 6. Finish trip -> save to history
      if (action === 'finish_trip') {
        const { tripId } = req.body;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        await query(`
          UPDATE trips
          SET status = 'finalizada', completed_at = NOW(), last_update = $1
          WHERE id = $2
        `, [timeStr, tripId]);

        return res.status(200).json({ success: true });
      }

      // 7. Delete trip
      if (action === 'delete_trip') {
        const { tripId } = req.body;
        if (!tripId) return res.status(400).json({ error: 'Falta el id de la hoja de ruta' });

        // Release assigned orders back to available
        await query(`
          UPDATE orders 
          SET trip_id = NULL, 
              status = CASE WHEN status = 'Aprobado y en hoja de ruta' THEN 'Pendiente de aprobación' ELSE status END
          WHERE trip_id = $1
        `, [tripId]).catch(() => {});

        await query(`DELETE FROM trip_stops WHERE trip_id = $1`, [tripId]);
        await query(`DELETE FROM trips WHERE id = $1`, [tripId]);

        return res.status(200).json({ success: true, deletedTripId: tripId });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    if (method === 'DELETE') {
      const { id, tripId } = req.query || {};
      const targetId = id || tripId;
      if (!targetId) return res.status(400).json({ error: 'Falta el id de la hoja de ruta' });

      // Release assigned orders back to available
      await query(`
        UPDATE orders 
        SET trip_id = NULL, 
            status = CASE WHEN status = 'Aprobado y en hoja de ruta' THEN 'Pendiente de aprobación' ELSE status END
        WHERE trip_id = $1
      `, [targetId]).catch(() => {});

      await query(`DELETE FROM trip_stops WHERE trip_id = $1`, [targetId]);
      await query(`DELETE FROM trips WHERE id = $1`, [targetId]);

      return res.status(200).json({ success: true, deletedTripId: targetId });
    }

    return res.status(405).json({ error: `Method ${method} not allowed` });
  } catch (error) {
    console.error('API trips error:', error);
    return res.status(500).json({ error: error.message });
  }
}
