// API Client for POLAR connected directly to Neon PostgreSQL via /api/

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Using offline products cache:', err.message);
    return null;
  }
}

export async function fetchClients(search = '') {
  try {
    const url = search ? `${API_BASE}/clients?search=${encodeURIComponent(search)}` : `${API_BASE}/clients`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch clients');
    return await res.json();
  } catch (err) {
    console.warn('Using offline clients cache:', err.message);
    return null;
  }
}

export async function fetchTrips() {
  try {
    const res = await fetch(`${API_BASE}/trips`);
    if (!res.ok) throw new Error('Failed to fetch trips');
    return await res.json();
  } catch (err) {
    console.warn('Using offline trips cache:', err.message);
    return null;
  }
}

export async function updateDriverCoords(tripId, lat, lng) {
  try {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_driver_coords', tripId, lat, lng })
    });
    return await res.json();
  } catch (err) {
    console.warn('Offline coordinate update error:', err);
    return null;
  }
}

export async function updateStopStatus(stopId, data) {
  try {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_stop_status', stopId, ...data })
    });
    return await res.json();
  } catch (err) {
    console.warn('Offline stop update error:', err);
    return null;
  }
}

export async function addStopToTrip(tripId, stop) {
  try {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_stop', tripId, stop })
    });
    return await res.json();
  } catch (err) {
    console.warn('Offline add stop error:', err);
    return null;
  }
}

export async function fetchOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  } catch (err) {
    console.warn('Using offline orders cache:', err.message);
    return null;
  }
}

export async function createOrder(orderData) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return await res.json();
  } catch (err) {
    console.warn('Offline create order error:', err);
    return null;
  }
}

export async function updateOrderStatus(orderId, status, tripId = null) {
  try {
    const res = await fetch(`${API_BASE}/orders?id=${encodeURIComponent(orderId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, tripId })
    });
    return await res.json();
  } catch (err) {
    console.warn('Offline update order status error:', err);
    return null;
  }
}

export async function fetchDashboardKPIs() {
  try {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard KPIs');
    return await res.json();
  } catch (err) {
    console.warn('Using offline dashboard KPI cache:', err.message);
    return null;
  }
}
