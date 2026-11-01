// Service for live synchronization between Driver Trip Links and the Admin Dashboard
const CHANNEL_NAME = 'polar_trip_sync_channel';
const STORAGE_KEY = 'polar_trips_data_v1';

// Initial trips seed
export const INITIAL_TRIPS = {
  'VIAJE-25': {
    id: 'VIAJE-25',
    tripNumber: 25,
    driverName: 'Marcos Gutiérrez',
    truck: 'Camión #1 (Mercedes Sprinter)',
    driverPhone: '5491155550100',
    zone: 'Zona Centro / Alberdi',
    driverCoords: { lat: -31.4089, lng: -64.1956 },
    lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    stops: [
      {
        id: 'stop-1',
        orderNumber: 1,
        clientName: 'Don Mario Talleres',
        address: 'Loyola 320, Alberdi',
        phone: '5491155550101',
        coords: { lat: -31.4045, lng: -64.1910 },
        items: [{ name: 'Bidón 20L', qty: 2, price: 4200 }],
        total: 8400,
        status: 'entregado',
        deliveredAt: '15:20',
        paymentMethod: 'Efectivo',
        returnedEmpty: 2
      },
      {
        id: 'stop-2',
        orderNumber: 2,
        clientName: 'Familia Rossi',
        address: 'Serrano 540, Alberdi',
        phone: '5491155550102',
        coords: { lat: -31.4070, lng: -64.1935 },
        items: [
          { name: 'Bidón 20L', qty: 1, price: 4200 },
          { name: 'Sifón Soda 1.5L', qty: 2, price: 1300 }
        ],
        total: 6800,
        status: 'entregado',
        deliveredAt: '15:35',
        paymentMethod: 'Transferencia',
        returnedEmpty: 1
      },
      {
        id: 'stop-3',
        orderNumber: 3,
        clientName: 'María Esther López',
        address: 'Camargo 460, Alberdi',
        phone: '5491155550105',
        coords: { lat: -31.4110, lng: -64.1980 },
        items: [{ name: 'Bidón 20L', qty: 2, price: 4200 }],
        total: 8400,
        status: 'en_camino',
        isNext: true,
        deliveredAt: null,
        paymentMethod: 'Efectivo',
        returnedEmpty: 0
      },
      {
        id: 'stop-4',
        orderNumber: 4,
        clientName: 'Roberto Fernández',
        address: 'Aguirre 750, Alberdi',
        phone: '5491155550108',
        coords: { lat: -31.4140, lng: -64.2010 },
        items: [{ name: 'Bidón 20L', qty: 3, price: 4200 }],
        total: 12600,
        status: 'pendiente',
        deliveredAt: null,
        paymentMethod: 'Efectivo',
        returnedEmpty: 0
      }
    ]
  },
  'VIAJE-26': {
    id: 'VIAJE-26',
    tripNumber: 26,
    driverName: 'Sofía Ramos',
    truck: 'Camión #2 (Renault Master)',
    driverPhone: '5491155550200',
    zone: 'Zona Norte / San Martín',
    driverCoords: { lat: -31.3980, lng: -64.1850 },
    lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    stops: [
      {
        id: 'stop-26-1',
        orderNumber: 1,
        clientName: 'Panadería La Espiga',
        address: 'Juan B. Justo 3420',
        phone: '5491155550112',
        coords: { lat: -31.3920, lng: -64.1820 },
        items: [{ name: 'Bidón 20L', qty: 4, price: 4200 }],
        total: 16800,
        status: 'entregado',
        deliveredAt: '15:15',
        paymentMethod: 'Efectivo',
        returnedEmpty: 4
      },
      {
        id: 'stop-26-2',
        orderNumber: 2,
        clientName: 'Consultorio Dental Crespo',
        address: 'Corrientes 4800, Piso 2',
        phone: '5491155550103',
        coords: { lat: -31.3950, lng: -64.1840 },
        items: [{ name: 'Bidón 20L', qty: 3, price: 4200 }],
        total: 12600,
        status: 'entregado',
        deliveredAt: '15:40',
        paymentMethod: 'Transferencia',
        returnedEmpty: 3
      },
      {
        id: 'stop-26-3',
        orderNumber: 3,
        clientName: 'Rubén Álvarez',
        address: 'Vera 620, San Martín',
        phone: '5491155550106',
        coords: { lat: -31.3990, lng: -64.1880 },
        items: [{ name: 'Bidón 20L', qty: 3, price: 4200 }],
        total: 12600,
        status: 'en_camino',
        isNext: true,
        deliveredAt: null,
        paymentMethod: 'Efectivo',
        returnedEmpty: 0
      },
      {
        id: 'stop-26-4',
        orderNumber: 4,
        clientName: 'Raúl Medina',
        address: 'Castro Barros 1120',
        phone: '5491155550107',
        coords: { lat: -31.4020, lng: -64.1900 },
        items: [{ name: 'Bidón 12L c/ canilla', qty: 2, price: 3300 }],
        total: 6600,
        status: 'pendiente',
        deliveredAt: null,
        paymentMethod: 'Fiado (Cta Cte)',
        returnedEmpty: 0
      }
    ]
  }
};

// Get all trips from localStorage with fallback
export function getStoredTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  saveTrips(INITIAL_TRIPS);
  return INITIAL_TRIPS;
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
