// API Client for POLAR connected directly to Neon PostgreSQL via /api/

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ===================== AUTH & USERS =====================
export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error de autenticación');
  return data;
}

export async function verifySession(token) {
  try {
    const res = await fetch(`${API_BASE}/auth?type=verify&token=${encodeURIComponent(token)}`);
    if (!res.ok) return { valid: false };
    return await res.json();
  } catch {
    return { valid: false };
  }
}

export async function fetchUsers() {
  try {
    const res = await fetch(`${API_BASE}/auth`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  } catch (err) {
    console.warn('Users fetch error:', err.message);
    return null;
  }
}

export async function createUser(userData) {
  const res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create_user', ...userData })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo crear el usuario');
  return data;
}

export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/auth?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo eliminar el usuario');
  return data;
}

// ===================== PRODUCTS & BLOB UPLOAD =====================
export async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return await res.json();
  } catch (err) {
    console.warn('Using offline products cache:', err.message);
    return null;
  }
}

export async function createProduct(productData) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear producto');
  return data;
}

export async function updateProduct(id, productData) {
  const res = await fetch(`${API_BASE}/products?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar producto');
  return data;
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_BASE}/products?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar producto');
  return data;
}

export async function uploadProductImage(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'image/png',
      base64
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al subir imagen a Vercel Blob');
  return data.url;
}

// ===================== CLIENTS =====================
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

export async function createClient(clientData) {
  const res = await fetch(`${API_BASE}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear cliente');
  return data;
}

export async function updateClient(id, clientData) {
  const res = await fetch(`${API_BASE}/clients?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar cliente');
  return data;
}

export async function deleteClient(id) {
  const res = await fetch(`${API_BASE}/clients?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar cliente');
  return data;
}

// ===================== TRIPS & DRIVER LIVE SYNC =====================
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

export async function fetchTripByNumber(tripNumber) {
  try {
    const res = await fetch(`${API_BASE}/trips?tripNumber=${encodeURIComponent(tripNumber)}`);
    if (!res.ok) throw new Error('Failed to fetch trip');
    const data = await res.json();
    const list = Object.values(data || {});
    return list[0] || null;
  } catch (err) {
    console.warn('Trip fetch error:', err.message);
    return null;
  }
}

export async function createTrip(tripData) {
  const res = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create_trip', ...tripData })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear hoja de ruta');
  return data;
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

export async function setNextStop(tripId, stopId, driverCoords = null) {
  try {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set_next_stop',
        tripId,
        stopId,
        driverLat: driverCoords?.lat ?? null,
        driverLng: driverCoords?.lng ?? null
      })
    });
    return await res.json();
  } catch (err) {
    console.warn('Offline setNextStop error:', err);
    return null;
  }
}

export async function finishTrip(tripId) {
  try {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'finish_trip', tripId })
    });
    return await res.json();
  } catch (err) {
    console.warn('Offline finishTrip error:', err);
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

// ===================== ORDERS =====================
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

export async function updateOrder(orderId, orderData) {
  const res = await fetch(`${API_BASE}/orders?id=${encodeURIComponent(orderId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al actualizar el pedido');
  return data;
}

export async function deleteOrder(orderId) {
  const res = await fetch(`${API_BASE}/orders?id=${encodeURIComponent(orderId)}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar el pedido');
  return data;
}

// ===================== DASHBOARD =====================
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
