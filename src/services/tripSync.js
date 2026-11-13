// Service for live synchronization between Driver Trip Links and the Admin Dashboard
const CHANNEL_NAME = 'polar_trip_sync_channel';
const STORAGE_KEY = 'polar_trips_data_v1';

// Initial trips seed (empty for clean test loads)
export const INITIAL_TRIPS = {};

// Get all trips from localStorage with fallback
export function getStoredTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Clean legacy mock trips if present
      if (parsed['VIAJE-25'] || parsed['VIAJE-26']) {
        delete parsed['VIAJE-25'];
        delete parsed['VIAJE-26'];
        saveTrips(parsed);
      }
      return parsed;
    }
  } catch (e) {}
  return {};
}

// Save trips and broadcast event to all open tabs/windows
export function saveTrips(tripsData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tripsData));
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: 'TRIPS_SYNC', trips: tripsData });
      channel.close();
    }
  } catch (e) {}
}

// Subscribe to real-time updates
export function subscribeToTripUpdates(callback) {
  let channel = null;
  if (typeof window !== 'undefined' && window.BroadcastChannel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'TRIPS_SYNC') {
        callback(event.data.trips);
      }
    };
  }

  // Also listen to storage events (cross-tab fallback)
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch (err) {}
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) channel.close();
    window.removeEventListener('storage', handleStorage);
  };
}

// Orders Storage & URL encoding
const ORDERS_STORAGE_KEY = 'polar_orders_database_v1';

export const INITIAL_ORDERS = [
  {
    orderId: 'POLAR-90184',
    clientName: 'Juan Pérez (Pedido Web)',
    clientPhone: '5493512345678',
    address: 'Av. Colón 1450, Piso 3 Depto B',
    neighborhood: 'Alberdi',
    notes: 'Tocar timbre portón negro',
    coords: { lat: -31.4089, lng: -64.1956 },
    items: [
      { name: 'Bidón de Agua 20L', qty: 2, price: 4200 },
      { name: 'Sifón de Soda 1.5L', qty: 2, price: 1300 }
    ],
    total: 11000,
    status: 'Pendiente de aprobación',
    createdAt: new Date().toISOString()
  }
];

export function getStoredOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return INITIAL_ORDERS;
}

import { createOrder, addStopToTrip } from './api';

export function saveOrder(order) {
  try {
    const current = getStoredOrders();
    const existingIndex = current.findIndex(o => o.orderId === order.orderId);
    let updated;
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...order };
    } else {
      updated = [order, ...current];
    }
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
    
    // Save to Neon PostgreSQL database in background
    createOrder(order).catch(e => console.warn('DB order sync error:', e));

    return updated;
  } catch (e) {
    return [order];
  }
}

// Add an approved client order directly as a delivery stop into an active driver route
export function addOrderToActiveTrip(order, targetTripId = 'VIAJE-25') {
  const currentTrips = getStoredTrips();
  const trip = currentTrips[targetTripId] || Object.values(currentTrips)[0];
  if (!trip) return null;

  // Check if stop already added
  const existingStop = trip.stops?.find(s => s.orderRef === order.orderId);
  if (existingStop) return trip;

  const newStop = {
    id: `stop-${order.orderId || Date.now()}`,
    orderRef: order.orderId,
    orderNumber: (trip.stops?.length || 0) + 1,
    clientName: order.clientName,
    address: `${order.address}${order.neighborhood ? ` (${order.neighborhood})` : ''}`,
    phone: order.clientPhone,
    coords: order.coords || { lat: -31.4120, lng: -64.1940 },
    items: order.items || [],
    total: order.total || 0,
    notes: order.notes || '',
    status: 'pendiente',
    deliveredAt: null,
    paymentMethod: 'Efectivo',
    returnedEmpty: 0
  };

  trip.stops = [...(trip.stops || []), newStop];
  trip.lastUpdate = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  currentTrips[trip.id] = trip;
  saveTrips(currentTrips);

  // Sync stop to Neon PostgreSQL database in background
  addStopToTrip(targetTripId, newStop).catch(e => console.warn('DB stop sync error:', e));

  return trip;
}

// Safely encode client order into a compact base64 URL query string parameter
export function encodeOrderParam(order) {
  try {
    const compact = {
      id: order.orderId,
      n: order.clientName,
      p: order.clientPhone,
      a: order.address,
      b: order.neighborhood,
      nt: order.notes,
      c: order.coords,
      it: order.items,
      t: order.total
    };
    const jsonStr = JSON.stringify(compact);
    const bytes = new TextEncoder().encode(jsonStr);
    let binString = '';
    for (let i = 0; i < bytes.length; i++) {
      binString += String.fromCharCode(bytes[i]);
    }
    return encodeURIComponent(btoa(binString));
  } catch (e) {
    console.error('Error encoding order data:', e);
    return '';
  }
}

// Decode compact order data from URL parameter
export function decodeOrderParam(encoded) {
  if (!encoded) return null;
  try {
    const binString = atob(decodeURIComponent(encoded));
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const compact = JSON.parse(jsonStr);
    return {
      orderId: compact.id,
      clientName: compact.n,
      clientPhone: compact.p,
      address: compact.a,
      neighborhood: compact.b,
      notes: compact.nt,
      coords: compact.c,
      items: compact.it,
      total: compact.t,
      status: 'Pendiente de aprobación',
      createdAt: new Date().toISOString()
    };
  } catch (e) {
    console.error('Error decoding order data:', e);
    return null;
  }
}
